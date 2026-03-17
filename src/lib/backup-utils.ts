import type { BackupTrigger } from "@/generated/prisma"

function compactDatePart(value: number) {
  return String(value).padStart(2, "0")
}

export function buildBackupFilename(
  churchId: string,
  triggerType: BackupTrigger,
  createdAt = new Date()
) {
  const stamp = [
    createdAt.getUTCFullYear(),
    compactDatePart(createdAt.getUTCMonth() + 1),
    compactDatePart(createdAt.getUTCDate()),
    compactDatePart(createdAt.getUTCHours()),
    compactDatePart(createdAt.getUTCMinutes()),
    compactDatePart(createdAt.getUTCSeconds()),
  ].join("")

  return `${churchId}-${triggerType.toLowerCase()}-${stamp}.json`
}
