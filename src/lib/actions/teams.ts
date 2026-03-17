"use server"

import { db } from "@/lib/db"
import { ensurePermission, getAuthUser } from "./helpers"
import { addUserToTeamChannels, removeUserFromTeamChannels } from "@/lib/channel-access"

// ---------- Types ----------

export interface TeamSummary {
  id: string
  name: string
  color: string
  leaderId: string | null
  leaderName: string | null
  memberCount: number
}

export interface TeamDetail {
  id: string
  name: string
  color: string
  leaderId: string | null
  members: {
    id: string
    position: string | null
    isLeader: boolean
    user: {
      id: string
      name: string
      email: string
      avatar: string | null
    }
  }[]
}

export interface DirectoryPerson {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  avatar: string | null
  teams: { id: string; name: string; color: string }[]
  tags: { id: string; name: string; color: string }[]
}

// ---------- Actions ----------

export async function getTeams(churchId: string): Promise<TeamSummary[]> {
  const user = await getAuthUser()
  await ensurePermission("teams.view", user)
  if (user.churchId !== churchId) throw new Error("Sin acceso a esta iglesia")

  const teams = await db.team.findMany({
    where: { churchId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { members: true } },
      members: {
        where: { isLeader: true },
        include: { user: { select: { name: true } } },
        take: 1,
      },
    },
  })

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    leaderId: t.leaderId,
    leaderName: t.members[0]?.user.name ?? null,
    memberCount: t._count.members,
  }))
}

export async function getTeamById(id: string): Promise<TeamDetail | null> {
  const user = await getAuthUser()
  await ensurePermission("teams.view", user)

  const team = await db.team.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: [{ isLeader: "desc" }, { createdAt: "asc" }],
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
    },
  })

  if (!team) return null
  if (team.churchId !== user.churchId) throw new Error("Sin acceso a este equipo")

  return {
    id: team.id,
    name: team.name,
    color: team.color,
    leaderId: team.leaderId,
    members: team.members.map((m) => ({
      id: m.id,
      position: m.position,
      isLeader: m.isLeader,
      user: m.user,
    })),
  }
}

export async function getDirectory(churchId: string): Promise<DirectoryPerson[]> {
  const user = await getAuthUser()
  await ensurePermission("people.view", user)
  if (user.churchId !== churchId) throw new Error("Sin acceso a esta iglesia")

  const users = await db.user.findMany({
    where: { churchId, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatar: true,
      teamMembers: {
        include: {
          team: { select: { id: true, name: true, color: true } },
        },
      },
      userTags: {
        include: {
          tag: { select: { id: true, name: true, color: true } },
        },
      },
    },
  })

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    avatar: u.avatar,
    teams: u.teamMembers.map((tm) => tm.team),
    tags: u.userTags.map((ut) => ut.tag),
  }))
}

export async function addTeamMember(teamId: string, userId: string, position?: string) {
  const user = await getAuthUser()
  await ensurePermission("teams.add_members", user)

  const team = await db.team.findUnique({ where: { id: teamId }, select: { churchId: true } })
  if (!team) throw new Error("Equipo no encontrado")
  if (team.churchId !== user.churchId) throw new Error("Sin acceso")

  const targetUser = await db.user.findUnique({ where: { id: userId }, select: { churchId: true } })
  if (!targetUser || targetUser.churchId !== user.churchId) throw new Error("Usuario no encontrado")

  const member = await db.teamMember.create({
    data: {
      teamId,
      userId,
      position: position ?? null,
    },
  })

  await addUserToTeamChannels(userId, teamId)

  return { id: member.id }
}

export async function removeTeamMember(teamId: string, userId: string) {
  const user = await getAuthUser()
  await ensurePermission("teams.add_members", user)

  const team = await db.team.findUnique({ where: { id: teamId }, select: { churchId: true } })
  if (!team) throw new Error("Equipo no encontrado")
  if (team.churchId !== user.churchId) throw new Error("Sin acceso")

  await db.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  })

  await removeUserFromTeamChannels(userId, teamId)

  return { success: true }
}
