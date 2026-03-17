import { hasPermission } from "@/lib/permissions"
import { getAuthUser } from "@/lib/actions/helpers"
import { getCalendarEvents, type CalendarEventItem } from "@/lib/actions/calendar"
import { CalendarClient } from "./calendar-client"

export default async function CalendarPage() {
  const user = await getAuthUser()
  const canViewCalendar = await hasPermission(user.id, "calendar.view")

  let events: CalendarEventItem[] = []

  if (canViewCalendar) {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Fetch current month, previous month, and next month
    const months = [
      { month: currentMonth - 1 <= 0 ? 12 : currentMonth - 1, year: currentMonth - 1 <= 0 ? currentYear - 1 : currentYear },
      { month: currentMonth, year: currentYear },
      { month: currentMonth + 1 > 12 ? 1 : currentMonth + 1, year: currentMonth + 1 > 12 ? currentYear + 1 : currentYear },
    ]

    try {
      const results = await Promise.all(
        months.map(({ month, year }) =>
          getCalendarEvents(user.churchId, month, year)
        )
      )
      events = results.flat()
    } catch (err) {
      console.error("Error fetching calendar events:", err)
    }
  }

  // Serialize dates for client component
  const serializedEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date instanceof Date ? e.date.toISOString() : String(e.date),
    time: e.time,
    endDate: e.endDate instanceof Date ? e.endDate.toISOString() : e.endDate ? String(e.endDate) : null,
    type: e.type,
    serviceId: e.serviceId,
    externalId: e.externalId,
  }))

  return (
    <CalendarClient
      events={serializedEvents}
      canEdit={await hasPermission(user.id, "calendar.edit")}
      canView={canViewCalendar}
    />
  )
}
