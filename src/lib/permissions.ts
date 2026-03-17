import { type PermissionKey, PERMISSIONS } from "@/types/permissions"
import { ROLE_PERMISSIONS } from "@/lib/role-permissions"
import { db } from "@/lib/db"

export { ROLE_PERMISSIONS }

const allFalse = Object.fromEntries(
  Object.keys(PERMISSIONS).map((k) => [k, false])
) as Record<PermissionKey, boolean>

export async function hasPermission(
  userId: string,
  permission: PermissionKey
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      permissionOverrides: {
        where: { permissionKey: permission },
        select: { value: true },
      },
    },
  })

  if (!user) return false

  if (user.permissionOverrides.length > 0) {
    return user.permissionOverrides[0].value
  }

  return ROLE_PERMISSIONS[user.role]?.[permission] ?? false
}

export async function getUserPermissions(
  userId: string
): Promise<Record<PermissionKey, boolean>> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      permissionOverrides: true,
    },
  })

  if (!user) return { ...allFalse }

  const basePerms = { ...ROLE_PERMISSIONS[user.role] }

  for (const override of user.permissionOverrides) {
    if (override.permissionKey in basePerms) {
      basePerms[override.permissionKey as PermissionKey] = override.value
    }
  }

  return basePerms
}
