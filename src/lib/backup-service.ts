import { db } from "@/lib/db"
import type { BackupTrigger } from "@/generated/prisma"
import { buildBackupFilename } from "@/lib/backup-utils"
import {
  deleteBackupFile,
  readBackupFile,
  storeBackupFile,
} from "@/lib/backup-storage"

const MAX_BACKUPS_PER_CHURCH = 30

async function buildBackupPayload(churchId: string, triggerType: BackupTrigger) {
  const [
    church,
    users,
    teams,
    services,
    channels,
    tags,
    calendarEvents,
    permissionProfiles,
  ] = await Promise.all([
    db.church.findUnique({
      where: { id: churchId },
      include: {
        _count: {
          select: {
            users: true,
            teams: true,
            services: true,
            channels: true,
          },
        },
      },
    }),
    db.user.findMany({
      where: { churchId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    }),
    db.team.findMany({
      where: { churchId },
      include: {
        members: {
          select: {
            position: true,
            isLeader: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.service.findMany({
      where: { churchId },
      include: {
        items: {
          include: { songs: true, children: true },
          orderBy: { order: "asc" },
        },
        assignments: true,
      },
      orderBy: { date: "asc" },
    }),
    db.channel.findMany({
      where: { churchId },
      include: {
        members: {
          select: { userId: true, lastReadAt: true },
        },
        messages: {
          take: 50,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            senderId: true,
            content: true,
            type: true,
            isPinned: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.tag.findMany({
      where: { churchId },
      include: {
        userTags: {
          select: { userId: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.calendarEvent.findMany({
      where: { churchId },
      orderBy: { date: "asc" },
    }),
    db.permissionProfile.findMany({
      where: { churchId },
      orderBy: { name: "asc" },
    }),
  ])

  if (!church) {
    throw new Error("Iglesia no encontrada")
  }

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    triggerType,
    church,
    users,
    teams,
    services,
    channels,
    tags,
    calendarEvents,
    permissionProfiles,
  }
}

async function pruneOldBackups(churchId: string) {
  const backups = await db.backup.findMany({
    where: { churchId },
    orderBy: { createdAt: "desc" },
    skip: MAX_BACKUPS_PER_CHURCH,
  })

  for (const backup of backups) {
    await deleteBackupFile(backup.storageUrl)
  }

  if (backups.length > 0) {
    await db.backup.deleteMany({
      where: { id: { in: backups.map((backup) => backup.id) } },
    })
  }
}

export async function createBackupSnapshot(input: {
  churchId: string
  triggeredBy: string
  triggerType: BackupTrigger
}) {
  const createdAt = new Date()
  const payload = await buildBackupPayload(input.churchId, input.triggerType)
  const content = JSON.stringify(payload, null, 2)
  const fileName = buildBackupFilename(
    input.churchId,
    input.triggerType,
    createdAt
  )
  const storageUrl = await storeBackupFile({
    churchId: input.churchId,
    fileName,
    content,
  })

  const backup = await db.backup.create({
    data: {
      churchId: input.churchId,
      triggerType: input.triggerType,
      triggeredBy: input.triggeredBy,
      sizeBytes: Buffer.byteLength(content, "utf8"),
      storageUrl,
      createdAt,
    },
  })

  await pruneOldBackups(input.churchId)

  return backup
}

export async function createLoginBackupIfNeeded(input: {
  id?: string | null
  churchId?: string | null
  role?: string | null
}) {
  if (!input.id || !input.churchId) return

  const triggerType =
    input.role === "ADMIN"
      ? "LOGIN_ADMIN"
      : input.role === "RESPONSABLE"
        ? "LOGIN_RESPONSABLE"
        : null

  if (!triggerType) return

  await createBackupSnapshot({
    churchId: input.churchId,
    triggeredBy: input.id,
    triggerType,
  })
}
export { readBackupFile }
