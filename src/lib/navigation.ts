import type { PermissionKey } from "@/types/permissions"

export type NavIconKey =
  | "dashboard"
  | "services"
  | "teams"
  | "calendar"
  | "messages"
  | "reports"
  | "settings"
  | "service-create"
  | "event-create"
  | "message-create"
  | "person-add"

export interface AppNavigationItem {
  href: string
  label: string
  icon: NavIconKey
  permission?: PermissionKey
  description?: string
}

export const DASHBOARD_NAV_ITEMS: AppNavigationItem[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  {
    href: "/services",
    label: "Servicios",
    icon: "services",
    permission: "services.view",
  },
  {
    href: "/teams",
    label: "Equipos",
    icon: "teams",
    permission: "teams.view",
  },
  {
    href: "/calendar",
    label: "Calendario",
    icon: "calendar",
    permission: "calendar.view",
  },
  {
    href: "/messages",
    label: "Mensajes",
    icon: "messages",
    permission: "messages.send",
  },
  {
    href: "/reports",
    label: "Reportes",
    icon: "reports",
    permission: "reports.view",
  },
  {
    href: "/admin/settings",
    label: "Admin",
    icon: "settings",
    permission: "admin.settings",
  },
]

export const QUICK_ACTION_ITEMS: AppNavigationItem[] = [
  {
    href: "/services",
    label: "Nuevo servicio",
    description: "Crear un servicio desde cero",
    icon: "service-create",
    permission: "services.edit",
  },
  {
    href: "/calendar",
    label: "Nuevo evento",
    description: "Agregar evento al calendario",
    icon: "event-create",
    permission: "calendar.edit",
  },
  {
    href: "/messages",
    label: "Nuevo mensaje",
    description: "Enviar mensaje a un equipo o persona",
    icon: "message-create",
    permission: "messages.send",
  },
  {
    href: "/teams?tab=directory&add=1",
    label: "Agregar persona",
    description: "Incorporar miembro al directorio",
    icon: "person-add",
    permission: "people.manage",
  },
  {
    href: "/admin/settings",
    label: "Configuración",
    description: "Ajustes de la iglesia",
    icon: "settings",
    permission: "admin.settings",
  },
]

export function filterNavigationItems<T extends { permission?: PermissionKey }>(
  items: T[],
  permissions: Partial<Record<PermissionKey, boolean>>
) {
  return items.filter((item) =>
    item.permission ? Boolean(permissions[item.permission]) : true
  )
}
