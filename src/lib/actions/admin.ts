"use server"

import type { Role, BackupTrigger } from "@/generated/prisma"
import { getAuthUser } from "./helpers"
import { createBackupSnapshot } from "@/lib/backup-service"
import { db } from "@/lib/db"

function requireAdmin(role: string) {
  if (role !== "ADMIN") throw new Error("Se requiere rol de administrador")
}

// ---------- Types ----------

export interface UserWithOverrides {
  id: string
  name: string
  email: string
  role: Role
  avatar: string | null
  hasOverrides: boolean
  overrides: {
    id: string
    permissionKey: string
    value: boolean
  }[]
}

export interface BackupEntry {
  id: string
  triggerType: BackupTrigger
  sizeBytes: number | null
  createdAt: Date
  triggerer: {
    id: string
    name: string
  }
}

export interface PermissionOverrideInput {
  permissionKey: string
  value: boolean
}

// ---------- Actions ----------

export async function getUsers(churchId: string): Promise<UserWithOverrides[]> {
  const user = await getAuthUser()
  if (user.churchId !== churchId) throw new Error("Sin acceso a esta iglesia")
  requireAdmin(user.role)

  const users = await db.user.findMany({
    where: { churchId, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      permissionOverrides: {
        select: { id: true, permissionKey: true, value: true },
      },
    },
  })

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    hasOverrides: u.permissionOverrides.length > 0,
    overrides: u.permissionOverrides,
  }))
}

export async function updateUserRole(userId: string, role: Role) {
  const user = await getAuthUser()
  requireAdmin(user.role)

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { churchId: true },
  })
  if (!targetUser) throw new Error("Usuario no encontrado")
  if (targetUser.churchId !== user.churchId) throw new Error("Sin acceso")

  await db.user.update({
    where: { id: userId },
    data: { role },
  })

  return { success: true }
}

export async function updatePermissionOverrides(
  userId: string,
  overrides: PermissionOverrideInput[]
) {
  const user = await getAuthUser()
  requireAdmin(user.role)

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { churchId: true },
  })
  if (!targetUser) throw new Error("Usuario no encontrado")
  if (targetUser.churchId !== user.churchId) throw new Error("Sin acceso")

  // Delete all existing overrides and recreate
  await db.$transaction([
    db.permissionOverride.deleteMany({ where: { userId } }),
    ...overrides.map((o) =>
      db.permissionOverride.create({
        data: {
          userId,
          permissionKey: o.permissionKey,
          value: o.value,
        },
      })
    ),
  ])

  return { success: true }
}

export async function getBackups(churchId: string): Promise<BackupEntry[]> {
  const user = await getAuthUser()
  if (user.churchId !== churchId) throw new Error("Sin acceso a esta iglesia")
  requireAdmin(user.role)

  const backups = await db.backup.findMany({
    where: { churchId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      triggerer: { select: { id: true, name: true } },
    },
  })

  return backups.map((b) => ({
    id: b.id,
    triggerType: b.triggerType,
    sizeBytes: b.sizeBytes,
    createdAt: b.createdAt,
    triggerer: b.triggerer,
  }))
}

export async function createBackup(churchId: string) {
  const user = await getAuthUser()
  if (user.churchId !== churchId) throw new Error("Sin acceso a esta iglesia")
  requireAdmin(user.role)

  const backup = await createBackupSnapshot({
    churchId,
    triggerType: "MANUAL",
    triggeredBy: user.id,
  })

  return { id: backup.id }
}
