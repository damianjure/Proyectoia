"use server"

import { db } from "@/lib/db"
import { ensurePermission, getAuthUser } from "./helpers"

// ---------- Types ----------

export interface ReportStats {
  totalServices: number
  activeVolunteers: number
  averageConfirmationRate: number
  teamCoverage: {
    name: string
    color: string
    coverage: number
  }[]
  topSongs: {
    songName: string
    artist: string | null
    count: number
  }[]
}

export interface ActivityLogEntry {
  id: string
  action: string
  section: string
  detail: string | null
  createdAt: Date
  user: {
    id: string
    name: string
  }
}

// ---------- Actions ----------

export async function getReportStats(churchId: string): Promise<ReportStats> {
  const user = await getAuthUser()
  await ensurePermission("reports.view", user)
  if (user.churchId !== churchId) throw new Error("Sin acceso a esta iglesia")

  // Total completed / published services
  const totalServices = await db.service.count({
    where: { churchId, status: { in: ["PUBLISHED", "COMPLETED"] } },
  })

  // Active volunteers: users who have at least one team membership
  const activeVolunteers = await db.user.count({
    where: {
      churchId,
      deletedAt: null,
      teamMembers: { some: {} },
    },
  })

  // Average confirmation rate across all services
  const allAssignments = await db.serviceAssignment.findMany({
    where: { service: { churchId } },
    select: { status: true },
  })
  const confirmed = allAssignments.filter((a) => a.status === "CONFIRMED").length
  const averageConfirmationRate =
    allAssignments.length > 0 ? Math.round((confirmed / allAssignments.length) * 100) : 0

  // Team coverage: percentage of assignments confirmed per team
  const teams = await db.team.findMany({
    where: { churchId },
    select: {
      id: true,
      name: true,
      color: true,
      serviceAssignments: {
        select: { status: true },
      },
    },
  })

  const teamCoverage = teams.map((t) => {
    const total = t.serviceAssignments.length
    const teamConfirmed = t.serviceAssignments.filter((a) => a.status === "CONFIRMED").length
    return {
      name: t.name,
      color: t.color,
      coverage: total > 0 ? Math.round((teamConfirmed / total) * 100) : 0,
    }
  })

  // Top songs: most used songs across all services
  const songs = await db.songSubItem.groupBy({
    by: ["songName", "artist"],
    _count: { songName: true },
    orderBy: { _count: { songName: "desc" } },
    take: 10,
    where: {
      serviceItem: { service: { churchId } },
    },
  })

  const topSongs = songs.map((s) => ({
    songName: s.songName,
    artist: s.artist,
    count: s._count.songName,
  }))

  return {
    totalServices,
    activeVolunteers,
    averageConfirmationRate,
    teamCoverage,
    topSongs,
  }
}

export async function getActivityLogs(churchId: string): Promise<ActivityLogEntry[]> {
  const user = await getAuthUser()
  await ensurePermission("reports.view", user)
  if (user.churchId !== churchId) throw new Error("Sin acceso a esta iglesia")

  const logs = await db.activityLog.findMany({
    where: { churchId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true } },
    },
  })

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    section: l.section,
    detail: l.detail,
    createdAt: l.createdAt,
    user: l.user,
  }))
}
