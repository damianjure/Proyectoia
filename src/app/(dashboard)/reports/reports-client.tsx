"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  Download,
  AlertTriangle,
  UserPlus,
  Eye,
} from "lucide-react"

interface ReportStats {
  totalServices: number
  activeVolunteers: number
  averageConfirmationRate: number
  teamCoverage: {
    name: string
    color: string
    coverage: number
  }[]
  topSongs: {
    songName: string
    artist: string | null
    count: number
  }[]
}

interface ActivityLogEntry {
  id: string
  action: string
  section: string
  detail: string | null
  createdAt: string
  user: {
    id: string
    name: string
  }
}

const LOG_TYPE_COLORS: Record<string, string> = {
  login: "bg-green-100 text-green-800",
  edit: "bg-amber-100 text-amber-800",
  confirm: "bg-blue-100 text-blue-800",
  reject: "bg-red-100 text-red-800",
  permissions: "bg-pink-100 text-pink-800",
}

interface ReportsClientProps {
  stats: ReportStats | null
  activityLogs: ActivityLogEntry[]
  canExport: boolean
  canView: boolean
}

export function ReportsClient({
  stats,
  activityLogs,
  canExport,
  canView,
}: ReportsClientProps) {
  const [period, setPeriod] = useState("month")

  if (!canView) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        No tenés permisos para ver reportes.
      </div>
    )
  }

  const statCards = stats
    ? [
        { title: "Asistencia promedio", value: `${stats.averageConfirmationRate}%`, icon: TrendingUp, trend: "" },
        { title: "Voluntarios activos", value: String(stats.activeVolunteers), icon: Users, trend: "" },
        { title: "Servicios realizados", value: String(stats.totalServices), icon: Calendar, trend: "" },
        { title: "Tasa de confirmación", value: `${stats.averageConfirmationRate}%`, icon: CheckCircle, trend: "" },
      ]
    : []

  const teamCoverage = stats?.teamCoverage ?? []
  const topSongs = stats?.topSongs ?? []

  // Build alerts dynamically from teamCoverage
  const alerts: { message: string; action: string; icon: typeof UserPlus }[] = []
  for (const team of teamCoverage) {
    if (team.coverage < 50) {
      alerts.push({
        message: `Equipo de ${team.name} con baja cobertura (${team.coverage}%)`,
        action: "Asignar personas",
        icon: UserPlus,
      })
    }
  }
  // Add generic alerts if none from coverage
  if (alerts.length === 0 && stats) {
    alerts.push({
      message: "Todo en orden. No hay alertas activas.",
      action: "Ver equipos",
      icon: Eye,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="month">Este mes</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Anual</option>
          </select>
          <Button variant="outline" disabled={!canExport}>
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="activity">Log de actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.length === 0 ? (
              <div className="col-span-full text-center text-sm text-muted-foreground py-4">
                No hay datos disponibles
              </div>
            ) : (
              statCards.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.trend && (
                      <p className="text-xs text-green-600">{stat.trend} vs periodo anterior</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Team coverage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cobertura por equipo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamCoverage.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay datos de equipos</p>
                ) : (
                  teamCoverage.map((team) => (
                    <div key={team.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{team.name}</span>
                        <span className="text-muted-foreground">{team.coverage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${team.coverage}%`, backgroundColor: team.color }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Top songs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Canciones más usadas</CardTitle>
              </CardHeader>
              <CardContent>
                {topSongs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay datos de canciones</p>
                ) : (
                  <div className="space-y-2">
                    {topSongs.map((song, i) => (
                      <div key={song.songName} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-4">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{song.songName}</p>
                          <p className="text-xs text-muted-foreground">{song.artist ?? "Desconocido"}</p>
                        </div>
                        <Badge variant="secondary">{song.count}x</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <p className="text-sm flex-1">{alert.message}</p>
                  <Button variant="outline" size="sm">
                    <alert.icon className="h-3 w-3 mr-1" />
                    {alert.action}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Log de actividad</CardTitle>
                <Button variant="outline" size="sm" disabled={!canExport}>
                  <Download className="h-4 w-4 mr-1" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay actividad registrada</p>
              ) : (
                <div className="space-y-2">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}{" "}
                        {new Date(log.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="font-medium whitespace-nowrap">{log.user.name}</span>
                      <Badge variant="outline" className={LOG_TYPE_COLORS[log.action.toLowerCase()] ?? "bg-gray-100 text-gray-800"}>
                        {log.action}
                      </Badge>
                      <span className="text-muted-foreground">{log.section}</span>
                      <span className="flex-1 truncate text-muted-foreground">{log.detail ?? ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
