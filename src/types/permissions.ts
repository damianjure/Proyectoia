export const PERMISSIONS = {
  "services.view": "Ver servicios",
  "services.edit": "Editar servicios",
  "services.publish": "Publicar servicios",
  "services.delete": "Eliminar servicios",
  "teams.view": "Ver equipos",
  "teams.manage": "Gestionar equipos",
  "teams.add_members": "Agregar miembros",
  "calendar.view": "Ver calendario",
  "calendar.edit": "Editar eventos",
  "messages.send": "Enviar mensajes",
  "messages.broadcast": "Enviar avisos masivos",
  "people.view": "Ver directorio",
  "people.manage": "Gestionar personas",
  "people.export": "Exportar datos",
  "reports.view": "Ver reportes",
  "reports.export": "Exportar reportes",
  "admin.roles": "Gestionar roles",
  "admin.settings": "Configuración",
  "admin.activity_log": "Ver log de actividad",
  "admin.backups": "Gestionar backups",
} as const

export type PermissionKey = keyof typeof PERMISSIONS
