import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserOrDevFallback } from "@/lib/current-user"
import { hasPermission } from "@/lib/permissions"
import { getAccessibleChannelForUser } from "@/lib/channel-access"

// PATCH /api/messages/[messageId]/pin - Toggle pin
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await getCurrentUserOrDevFallback()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const canUseMessages = await hasPermission(user.id, "messages.send")
    if (!canUseMessages) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const { messageId } = await params

    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          select: { id: true },
        },
      },
    })

    if (!message) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 })
    }

    const channel = await getAccessibleChannelForUser(message.channel.id, user)
    if (!channel) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 })
    }

    const updated = await db.message.update({
      where: { id: messageId },
      data: { isPinned: !message.isPinned },
    })

    return NextResponse.json({ isPinned: updated.isPinned })
  } catch (error) {
    console.error("PATCH pin error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
