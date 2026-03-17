import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"
import {
  buildRateLimitKeys,
  clearRateLimit,
  getRequestIp,
  isRateLimited,
  recordRateLimitFailure,
} from "@/lib/auth-rate-limit"

const REGISTER_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, churchName } = body
    const normalizedName = typeof name === "string" ? name.trim() : ""
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""
    const normalizedChurchName =
      typeof churchName === "string" ? churchName.trim() : ""
    const rateLimitKeys = buildRateLimitKeys("register", {
      email: normalizedEmail || null,
      ip: getRequestIp(request.headers),
    })

    if (!normalizedName || !normalizedEmail || !password || !normalizedChurchName) {
      return NextResponse.json(
        { error: "Nombre, iglesia, email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      )
    }

    if (
      rateLimitKeys.some((key) =>
        isRateLimited(key, REGISTER_RATE_LIMIT.maxAttempts, REGISTER_RATE_LIMIT.windowMs)
      )
    ) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intentá nuevamente más tarde." },
        { status: 429 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      rateLimitKeys.forEach((key) =>
        recordRateLimitFailure(key, REGISTER_RATE_LIMIT.maxAttempts, REGISTER_RATE_LIMIT.windowMs)
      )
      return NextResponse.json(
        { error: "No se pudo completar el registro" },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 12)

    const result = await db.$transaction(async (tx) => {
      const church = await tx.church.create({
        data: {
          name: normalizedChurchName,
        },
      })

      const user = await tx.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          password: hashedPassword,
          role: "ADMIN",
          churchId: church.id,
        },
      })

      const [generalChannel, broadcastChannel] = await Promise.all([
        tx.channel.create({
          data: { name: "General", type: "GENERAL", churchId: church.id },
        }),
        tx.channel.create({
          data: { name: "Anuncios", type: "BROADCAST", churchId: church.id },
        }),
      ])

      await tx.channelMember.createMany({
        data: [
          { channelId: generalChannel.id, userId: user.id },
          { channelId: broadcastChannel.id, userId: user.id },
        ],
        skipDuplicates: true,
      })

      return { user, church }
    })

    rateLimitKeys.forEach(clearRateLimit)

    return NextResponse.json(
      {
        message: "Usuario y iglesia creados exitosamente",
        userId: result.user.id,
        churchId: result.church.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
