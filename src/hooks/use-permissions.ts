"use client"

import { createContext, useContext } from "react"
import type { PermissionKey } from "@/types/permissions"

type PermissionContextType = {
  permissions: Record<PermissionKey, boolean>
  role: string
  can: (permission: PermissionKey) => boolean
  canAny: (...permissions: PermissionKey[]) => boolean
  canAll: (...permissions: PermissionKey[]) => boolean
}

export const PermissionContext = createContext<PermissionContextType | null>(
  null
)

export function usePermissions() {
  const ctx = useContext(PermissionContext)
  if (!ctx)
    throw new Error("usePermissions must be used within PermissionProvider")
  return ctx
}
