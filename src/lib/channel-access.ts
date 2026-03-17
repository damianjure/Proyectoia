import type { ChannelType } from "@/generated/prisma"
import { db } from "@/lib/db"

interface ChannelAccessUser {
  id: string
  churchId: string
}

const OPEN_CHANNEL_TYPES = new Set<ChannelType>(["GENERAL", "BROADCAST"])

function isOpenChannel(type: ChannelType) {
  return OPEN_CHANNEL_TYPES.has(type)
}

export async function syncDefaultChannelMemberships(userId: string, churchId: string) {
  const channels = await db.channel.findMany({
    where: {
      churchId,
      type: { in: ["GENERAL", "BROADCAST"] },
    },
    select: { id: true },
  })

  if (channels.length === 0) return

  await db.channelMember.createMany({
    data: channels.map((channel) => ({
      channelId: channel.id,
      userId,
    })),
    skipDuplicates: true,
  })
}

export async function addUserToTeamChannels(userId: string, teamId: string) {
  const channels = await db.channel.findMany({
    where: { teamId },
    select: { id: true },
  })

  if (channels.length === 0) return

  await db.channelMember.createMany({
    data: channels.map((channel) => ({
      channelId: channel.id,
      userId,
    })),
    skipDuplicates: true,
  })
}

export async function removeUserFromTeamChannels(userId: string, teamId: string) {
  const channels = await db.channel.findMany({
    where: { teamId },
    select: { id: true },
  })

  if (channels.length === 0) return

  await db.channelMember.deleteMany({
    where: {
      userId,
      channelId: { in: channels.map((channel) => channel.id) },
    },
  })
}

export async function getAccessibleChannelForUser(
  channelId: string,
  user: ChannelAccessUser
) {
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      churchId: true,
      type: true,
      teamId: true,
      members: {
        where: { userId: user.id },
        select: { id: true, lastReadAt: true },
        take: 1,
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
    },
  })

  if (!channel || channel.churchId !== user.churchId) {
    return null
  }

  const hasExplicitMembership = channel.members.length > 0
  const hasTeamMembership =
    channel.type === "TEAM" && Boolean(channel.team?.members.length)

  if (!hasExplicitMembership && !isOpenChannel(channel.type) && !hasTeamMembership) {
    return null
  }

  if (!hasExplicitMembership && (isOpenChannel(channel.type) || hasTeamMembership)) {
    await db.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId: channel.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        channelId: channel.id,
        userId: user.id,
      },
    })
  }

  return channel
}
