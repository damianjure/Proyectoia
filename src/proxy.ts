import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { isDevAuthBypassEnabled } from "@/lib/dev-auth"

const publicRoutes = ["/login", "/register", "/invite"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route))

  if (isDevAuthBypassEnabled()) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
