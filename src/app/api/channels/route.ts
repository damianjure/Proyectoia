import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserOrDevFallback } from "@/lib/current-user"
import { hasPermission } from "@/lib/permissions"
import { syncDefaultChannelMemberships } from "@/lib/channel-access"

// GET /api/channels - List channels for current user's church
export async function GET() {
  try {
    const user = await getCurrentUserOrDevFallback()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const canUseMessages = await hasPermission(user.id, "messages.send")
    if (!canUseMessages) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    await syncDefaultChannelMemberships(user.id, user.churchId)

    const channels = await db.channel.findMany({
      where: { churchId: user.churchId },
      include: {
        _count: { select: { messages: true, members: true } },
        members: {
          where: { userId: user.id },
          select: { id: true },
        },
        team: {
          select: {
            members: {
              where: { userId: user.id },
              select: { id: true },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    const visibleChannels = channels.filter((channel) => {
      if (channel.type === "GENERAL" || channel.type === "BROADCAST") {
        return true
      }

      if (channel.members.length > 0) {
        return true
      }

      return channel.type === "TEAM" && Boolean(channel.team?.members.length)
    })

    return NextResponse.json({
      channels: visibleChannels.map((ch) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        teamId: ch.teamId,
        messageCount: ch._count.messages,
        memberCount: ch._count.members,
        lastMessage: ch.messages[0]?.content ?? null,
        lastMessageAt: ch.messages[0]?.createdAt?.toISOString() ?? null,
      })),
    })
  } catch (error) {
    console.error("GET /api/channels error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
