import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserOrDevFallback } from "@/lib/current-user"
import { hasPermission } from "@/lib/permissions"
import { getAccessibleChannelForUser } from "@/lib/channel-access"

// GET /api/messages?channelId=xxx
export async function GET(request: Request) {
  try {
    const user = await getCurrentUserOrDevFallback()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const canUseMessages = await hasPermission(user.id, "messages.send")
    if (!canUseMessages) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")

    if (!channelId) {
      return NextResponse.json({ error: "channelId requerido" }, { status: 400 })
    }

    const channel = await getAccessibleChannelForUser(channelId, user)
    if (!channel) {
      return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 })
    }

    const messages = await db.message.findMany({
      where: { channelId },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    })

    return NextResponse.json({
      messages: messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("GET /api/messages error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST /api/messages
export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrDevFallback()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const canUseMessages = await hasPermission(user.id, "messages.send")
    if (!canUseMessages) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const body = await request.json()
    const { channelId, content } = body
    const normalizedContent =
      typeof content === "string" ? content.trim() : ""

    if (!channelId || !normalizedContent) {
      return NextResponse.json({ error: "channelId y content requeridos" }, { status: 400 })
    }

    const channel = await getAccessibleChannelForUser(channelId, user)
    if (!channel) {
      return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 })
    }

    const message = await db.message.create({
      data: {
        channelId,
        senderId: user.id,
        content: normalizedContent,
        type: "TEXT",
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({
      message: {
        ...message,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("POST /api/messages error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
