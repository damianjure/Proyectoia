export type Role = "ADMIN" | "RESPONSABLE" | "COLABORADOR" | "INVITADO"

export type ServiceStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED"

export type ServiceType = "REGULAR" | "SANTA_CENA" | "ESPECIAL"

export type ChannelType = "TEAM" | "GENERAL" | "DIRECT" | "BROADCAST"

export type MessageType = "TEXT" | "SYSTEM" | "FILE"

export type AssignmentStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "SUBSTITUTE"

export type TaskStatus = "PENDING" | "OPENED" | "IN_PROGRESS" | "COMPLETED"

export type EventType = "SERVICE" | "REHEARSAL" | "SPECIAL"

export type BackupTrigger = "LOGIN_ADMIN" | "LOGIN_RESPONSABLE" | "MANUAL"

export interface NavItem {
  href: string
  label: string
  icon: string
  permission?: string
  mobileOrder?: number
}
