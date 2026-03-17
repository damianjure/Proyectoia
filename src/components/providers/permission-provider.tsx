"use client"

import { PermissionContext } from "@/hooks/use-permissions"
import type { PermissionKey } from "@/types/permissions"

export function PermissionProvider({
  permissions,
  role,
  children,
}: {
  permissions: Record<PermissionKey, boolean>
  role: string
  children: React.ReactNode
}) {
  const can = (p: PermissionKey) => permissions[p] ?? false
  const canAny = (...ps: PermissionKey[]) => ps.some(can)
  const canAll = (...ps: PermissionKey[]) => ps.every(can)

  return (
    <PermissionContext.Provider value={{ permissions, role, can, canAny, canAll }}>
      {children}
    </PermissionContext.Provider>
  )
}
