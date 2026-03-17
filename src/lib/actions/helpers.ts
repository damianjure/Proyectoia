"use server"

import { getCurrentUser } from "@/lib/current-user"
import { hasPermission } from "@/lib/permissions"
import { db } from "@/lib/db"
import type { PermissionKey } from "@/types/permissions"
import { isDevAuthBypassEnabled } from "@/lib/dev-auth"

export interface AuthUser {
  id: string
  churchId: string
  role: string
}

/**
 * Gets the authenticated user from session.
 * In dev mode (SKIP_AUTH=true), falls back to the first admin user.
 */
export async function getAuthUser(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (user) {
    return user
  }

  // Dev mode fallback
  if (isDevAuthBypassEnabled()) {
    const admin = await db.user.findFirst({ where: { role: "ADMIN" } })
    if (admin) {
      return { id: admin.id, churchId: admin.churchId, role: admin.role }
    }
  }

  throw new Error("No autenticado")
}

export async function ensurePermission(
  permission: PermissionKey,
  user?: AuthUser
): Promise<AuthUser> {
  const currentUser = user ?? (await getAuthUser())
  const allowed = await hasPermission(currentUser.id, permission)

  if (!allowed) {
    throw new Error("Sin permisos")
  }

  return currentUser
}
