"use client"

import { usePermissions } from "@/hooks/use-permissions"
import type { PermissionKey } from "@/types/permissions"

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: PermissionKey | PermissionKey[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { can, canAny } = usePermissions()
  const allowed = Array.isArray(permission)
    ? canAny(...permission)
    : can(permission)
  return allowed ? <>{children}</> : <>{fallback}</>
}
