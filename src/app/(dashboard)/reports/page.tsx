import { hasPermission } from "@/lib/permissions"
import { getAuthUser } from "@/lib/actions/helpers"
import { getReportStats, getActivityLogs, type ReportStats, type ActivityLogEntry } from "@/lib/actions/reports"
import { ReportsClient } from "./reports-client"

export default async function ReportsPage() {
  const user = await getAuthUser()
  const canViewReports = await hasPermission(user.id, "reports.view")
  const canExportReports = await hasPermission(user.id, "reports.export")

  let stats: ReportStats | null = null
  let activityLogs: ActivityLogEntry[] = []

  if (canViewReports) {
    try {
      ;[stats, activityLogs] = await Promise.all([
        getReportStats(user.churchId),
        getActivityLogs(user.churchId),
      ])
    } catch (err) {
      console.error("Error fetching report data:", err)
    }
  }

  // Serialize dates for client component
  const serializedLogs = activityLogs.map((log) => ({
    ...log,
    createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt),
  }))

  return (
    <ReportsClient
      stats={stats}
      activityLogs={serializedLogs}
      canExport={canExportReports}
      canView={canViewReports}
    />
  )
}
