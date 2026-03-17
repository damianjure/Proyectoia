import { type PermissionKey, PERMISSIONS } from "@/types/permissions"

type RolePermissions = Record<string, Record<PermissionKey, boolean>>

const allTrue = Object.fromEntries(
  Object.keys(PERMISSIONS).map((k) => [k, true])
) as Record<PermissionKey, boolean>

const allFalse = Object.fromEntries(
  Object.keys(PERMISSIONS).map((k) => [k, false])
) as Record<PermissionKey, boolean>

export const ROLE_PERMISSIONS: RolePermissions = {
  ADMIN: { ...allTrue },

  RESPONSABLE: {
    ...allFalse,
    "services.view": true,
    "services.edit": true,
    "services.publish": true,
    "teams.view": true,
    "teams.add_members": true,
    "calendar.view": true,
    "calendar.edit": true,
    "messages.send": true,
    "people.view": true,
    "reports.view": true,
    "reports.export": true,
  },

  COLABORADOR: {
    ...allFalse,
    "services.view": true,
    "teams.view": true,
    "calendar.view": true,
    "messages.send": true,
    "people.view": true,
  },

  INVITADO: {
    ...allFalse,
    "services.view": true,
  },
}
