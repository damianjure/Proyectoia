import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getServerSession } from "next-auth"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"
import { createLoginBackupIfNeeded } from "@/lib/backup-service"
import {
  buildRateLimitKeys,
  clearRateLimit,
  getRequestIp,
  isRateLimited,
  recordRateLimitFailure,
} from "@/lib/auth-rate-limit"

const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000,
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null
        const normalizedEmail = credentials.email.trim().toLowerCase()
        const rateLimitKeys = buildRateLimitKeys("login", {
          email: normalizedEmail,
          ip: getRequestIp(req.headers),
        })

        if (
          rateLimitKeys.some((key) =>
            isRateLimited(key, LOGIN_RATE_LIMIT.maxAttempts, LOGIN_RATE_LIMIT.windowMs)
          )
        ) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            churchId: true,
            avatar: true,
            deletedAt: true,
          },
        })

        if (!user || !user.password || user.deletedAt) {
          rateLimitKeys.forEach((key) =>
            recordRateLimitFailure(key, LOGIN_RATE_LIMIT.maxAttempts, LOGIN_RATE_LIMIT.windowMs)
          )
          return null
        }

        const isValid = await compare(credentials.password, user.password)
        if (!isValid) {
          rateLimitKeys.forEach((key) =>
            recordRateLimitFailure(key, LOGIN_RATE_LIMIT.maxAttempts, LOGIN_RATE_LIMIT.windowMs)
          )
          return null
        }

        rateLimitKeys.forEach(clearRateLimit)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          churchId: user.churchId,
          image: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any
        token.role = u.role
        token.churchId = u.churchId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = session.user as any
        s.id = token.sub
        s.role = token.role
        s.churchId = token.churchId
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  events: {
    async signIn({ user }) {
      try {
        await createLoginBackupIfNeeded({
          id: user.id,
          churchId: user.churchId,
          role: user.role,
        })
      } catch (error) {
        console.error("Error creating login backup:", error)
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function getSession() {
  return await getServerSession(authOptions)
}
