"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalEvent {
  id: string
  title: string
  date: string // ISO string
  time: string | null
  endDate: string | null
  type: "SERVICE" | "REHEARSAL" | "SPECIAL"
  serviceId: string | null
  externalId: string | null
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  SERVICE: "bg-green-500",
  REHEARSAL: "bg-purple-500",
  SPECIAL: "bg-amber-500",
}

const EVENT_TYPE_HEX: Record<string, string> = {
  SERVICE: "#22C55E",
  REHEARSAL: "#A855F7",
  SPECIAL: "#F59E0B",
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  SERVICE: "Servicio",
  REHEARSAL: "Ensayo",
  SPECIAL: "Evento especial",
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

interface CalendarClientProps {
  events: CalEvent[]
  canEdit: boolean
  canView: boolean
}

export function CalendarClient({ events, canEdit, canView }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "agenda">("month")

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i)

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((e) => {
      const eventDate = new Date(e.date)
      const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`
      return eventDateStr === dateStr
    })
  }

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  if (!canView) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        No tenés permisos para ver el calendario.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <div className="flex gap-2">
          <div className="flex rounded-lg border">
            <button
              onClick={() => setView("month")}
              className={cn("px-3 py-1.5 text-sm", view === "month" && "bg-primary text-primary-foreground rounded-l-lg")}
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("agenda")}
              className={cn("px-3 py-1.5 text-sm", view === "agenda" && "bg-primary text-primary-foreground rounded-r-lg")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button disabled={!canEdit} title={canEdit ? "Crear evento" : "Sin permisos para editar"}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo evento
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {view === "month" ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>{MONTHS[month]} {year}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">{day}</div>
                ))}
                {calendarDays.map((day, i) => {
                  const dayEvents = day ? getEventsForDay(day) : []
                  return (
                    <div
                      key={i}
                      className={cn(
                        "min-h-[80px] rounded border p-1",
                        day ? "hover:bg-accent/50 cursor-pointer" : "bg-muted/20",
                        day && isToday(day) && "ring-2 ring-primary"
                      )}
                    >
                      {day && (
                        <>
                          <span className={cn("text-sm", isToday(day) && "font-bold text-primary")}>{day}</span>
                          <div className="mt-1 space-y-0.5">
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className="rounded px-1 py-0.5 text-[10px] text-white truncate"
                                style={{ backgroundColor: EVENT_TYPE_HEX[event.type] ?? "#6B7280" }}
                              >
                                {event.time ?? ""} {event.title}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 flex gap-4">
                {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${EVENT_TYPE_COLORS[type]}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Agenda</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay eventos próximos</p>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="h-10 w-1 rounded-full" style={{ backgroundColor: EVENT_TYPE_HEX[event.type] ?? "#6B7280" }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} {event.time ? `- ${event.time}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{EVENT_TYPE_LABELS[event.type] ?? event.type}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Próximos eventos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay eventos próximos</p>
            ) : (
              upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-start gap-2">
                  <div className={`mt-1 h-2 w-2 rounded-full ${EVENT_TYPE_COLORS[event.type] ?? "bg-gray-500"}`} />
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })} {event.time ?? ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
