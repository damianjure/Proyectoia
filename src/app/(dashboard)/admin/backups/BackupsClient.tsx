"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Database, RefreshCw, HardDrive } from "lucide-react"
import type { BackupEntry } from "@/lib/actions/admin"
import { createBackup } from "@/lib/actions/admin"
import { useRouter } from "next/navigation"

const TRIGGER_COLORS: Record<string, string> = {
  LOGIN_ADMIN: "bg-blue-100 text-blue-800",
  LOGIN_RESPONSABLE: "bg-green-100 text-green-800",
  MANUAL: "bg-purple-100 text-purple-800",
}

const TRIGGER_LABELS: Record<string, string> = {
  LOGIN_ADMIN: "Login Admin",
  LOGIN_RESPONSABLE: "Login Responsable",
  MANUAL: "Manual",
}

function formatSize(bytes: number | null): string {
  if (bytes === null) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) + " " + d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface BackupsClientProps {
  backups: BackupEntry[]
  churchId: string
}

export default function BackupsClient({ backups, churchId }: BackupsClientProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCreateBackup = () => {
    startTransition(async () => {
      await createBackup(churchId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Backups</h1>
        <Button onClick={handleCreateBackup} disabled={isPending}>
          <Database className="h-4 w-4 mr-2" />
          {isPending ? "Creando..." : "Backup manual"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <HardDrive className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="text-2xl font-bold">{backups.length}</p>
              <p className="text-xs text-muted-foreground">Backups almacenados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <RefreshCw className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="text-2xl font-bold">Automatico</p>
              <p className="text-xs text-muted-foreground">En cada login Admin/Resp</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Database className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="text-2xl font-bold">30</p>
              <p className="text-xs text-muted-foreground">Max. backups retenidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de backups</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay backups registrados todavia.
            </p>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium">{formatDate(backup.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">Por: {backup.triggerer.name}</p>
                    </div>
                    <Badge variant="outline" className={TRIGGER_COLORS[backup.triggerType] ?? ""}>
                      {TRIGGER_LABELS[backup.triggerType] ?? backup.triggerType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{formatSize(backup.sizeBytes)}</span>
                    <Link
                      href={`/api/backups/${backup.id}/download`}
                      className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border px-2.5 text-[0.8rem] hover:bg-muted"
                      target="_blank"
                    >
                      <Download className="h-4 w-4" />
                      Descargar
                    </Link>
                    <Button variant="outline" size="sm" disabled title="Restauración todavía no disponible">
                      Restaurar pronto
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
