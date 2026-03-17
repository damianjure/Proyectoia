import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserOrDevFallback } from "@/lib/current-user"
import { hasPermission } from "@/lib/permissions"
import { readBackupFile } from "@/lib/backup-service"
import { getRequestIp } from "@/lib/auth-rate-limit"
import { getBackupDownloadName } from "@/lib/backup-storage"

function getContentType(fileName: string) {
  return fileName.toLowerCase().endsWith(".zip")
    ? "application/zip"
    : "application/json; charset=utf-8"
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ backupId: string }> }
) {
  try {
    const user = await getCurrentUserOrDevFallback()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const canAccessBackups =
      user.role === "ADMIN" || (await hasPermission(user.id, "admin.backups"))
    if (!canAccessBackups) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const { backupId } = await params
    const backup = await db.backup.findUnique({
      where: { id: backupId },
      select: {
        id: true,
        churchId: true,
        storageUrl: true,
      },
    })

    if (!backup || backup.churchId !== user.churchId) {
      return NextResponse.json({ error: "Backup no encontrado" }, { status: 404 })
    }

    const file = await readBackupFile(backup.storageUrl)
    const fileName = getBackupDownloadName(backup.storageUrl, backup.id)

    await db.activityLog.create({
      data: {
        churchId: backup.churchId,
        userId: user.id,
        action: "download",
        section: "backups",
        detail: `Descargó backup ${backup.id}`,
        ip: getRequestIp(request.headers),
        device: request.headers.get("user-agent"),
      },
    })

    return new NextResponse(file, {
      headers: {
        "Content-Type": getContentType(fileName),
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return NextResponse.json({ error: "Archivo de backup no encontrado" }, { status: 404 })
    }

    console.error("GET /api/backups/[backupId]/download error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
