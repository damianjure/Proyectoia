"use server"

import { db } from "@/lib/db"
import type { ChannelType } from "@/generated/prisma"
import { ensurePermission, getAuthUser } from "./helpers"
import {
  getAccessibleChannelForUser,
  syncDefaultChannelMemberships,
} from "@/lib/channel-access"

// ---------- Types ----------

export interface ChannelSummary {
  id: string
  name: string
  type: ChannelType
  teamId: string | null
  unread: number
  lastMessage: string | null
}

export interface MessageItem {
  id: string
  content: string
  type: string
  isPinned: boolean
  createdAt: Date
  sender: {
    id: string
    name: string
    avatar: string | null
  }
}

// ---------- Actions ----------

export async function getChannels(churchId: string): Promise<ChannelSummary[]> {
  const user = await getAuthUser()
  await ensurePermission("messages.send", user)
  if (user.churchId !== churchId) throw new Error("Sin acceso a esta iglesia")

  await syncDefaultChannelMemberships(user.id, churchId)

  const channels = await db.channel.findMany({
    where: { churchId },
    orderBy: { name: "asc" },
    include: {
      members: {
        where: { userId: user.id },
        select: { lastReadAt: true },
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
      _count: { select: { messages: true } },
    },
  })

  const result: ChannelSummary[] = []

  for (const ch of channels) {
    const isAccessible =
      ch.type === "GENERAL" ||
      ch.type === "BROADCAST" ||
      ch.members.length > 0 ||
      (ch.type === "TEAM" && Boolean(ch.team?.members.length))

    if (!isAccessible) {
      continue
    }

    const membership = ch.members[0]
    const lastReadAt = membership?.lastReadAt ?? new Date(0)

    const unreadCount = membership
      ? await db.message.count({
          where: {
            channelId: ch.id,
            createdAt: { gt: lastReadAt },
          },
        })
      : 0

    result.push({
      id: ch.id,
      name: ch.name,
      type: ch.type,
      teamId: ch.teamId,
      unread: unreadCount,
      lastMessage: ch.messages[0]?.content ?? null,
    })
  }

  return result
}

export async function getMessages(channelId: string): Promise<MessageItem[]> {
  const user = await getAuthUser()
  await ensurePermission("messages.send", user)

  const channel = await getAccessibleChannelForUser(channelId, user)
  if (!channel) throw new Error("Canal no encontrado")

  // Update last read timestamp for this user
  await db.channelMember.upsert({
    where: { channelId_userId: { channelId, userId: user.id } },
    update: { lastReadAt: new Date() },
    create: { channelId, userId: user.id, lastReadAt: new Date() },
  })

  const messages = await db.message.findMany({
    where: { channelId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  })

  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    type: m.type,
    isPinned: m.isPinned,
    createdAt: m.createdAt,
    sender: m.sender,
  }))
}

export async function sendMessage(channelId: string, content: string) {
  const user = await getAuthUser()
  await ensurePermission("messages.send", user)

  const channel = await getAccessibleChannelForUser(channelId, user)
  if (!channel) throw new Error("Canal no encontrado")

  const message = await db.message.create({
    data: {
      channelId,
      senderId: user.id,
      content,
      type: "TEXT",
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  })

  // Update sender's last read timestamp
  await db.channelMember.upsert({
    where: { channelId_userId: { channelId, userId: user.id } },
    update: { lastReadAt: new Date() },
    create: { channelId, userId: user.id, lastReadAt: new Date() },
  })

  return {
    id: message.id,
    content: message.content,
    type: message.type,
    isPinned: message.isPinned,
    createdAt: message.createdAt,
    sender: message.sender,
  }
}

export async function togglePinMessage(messageId: string) {
  const user = await getAuthUser()
  await ensurePermission("messages.send", user)

  const message = await db.message.findUnique({
    where: { id: messageId },
    include: { channel: { select: { id: true } } },
  })
  if (!message) throw new Error("Mensaje no encontrado")

  const channel = await getAccessibleChannelForUser(message.channel.id, user)
  if (!channel) throw new Error("Sin acceso")

  const updated = await db.message.update({
    where: { id: messageId },
    data: { isPinned: !message.isPinned },
  })

  return { id: updated.id, isPinned: updated.isPinned }
}
