"use server"

import { db } from "@/lib/db"
import type { EventType } from "@/generated/prisma"
import { ensurePermission, getAuthUser } from "./helpers"

// ---------- Types ----------

export interface CalendarEventItem {
  id: string
  title: string
  date: Date
  time: string | null
  endDate: Date | null
  type: EventType
  serviceId: string | null
  externalId: string | null
}

export interface CreateCalendarEventInput {
  title: string
  date: string
  time?: string
  endDate?: string
  type: EventType
  serviceId?: string
}

export interface UpdateCalendarEventInput {
  title?: string
  date?: string
  time?: string
  endDate?: string | null
  type?: EventType
  serviceId?: string | null
}

// ---------- Actions ----------

export async function getCalendarEvents(
  churchId: string,
  month: number,
  year: number
): Promise<CalendarEventItem[]> {
  const user = await getAuthUser()
  await ensurePermission("calendar.view", user)
  if (user.churchId !== churchId) throw new Error("Sin acceso a esta iglesia")

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const events = await db.calendarEvent.findMany({
    where: {
      churchId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  })

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    time: e.time,
    endDate: e.endDate,
    type: e.type,
    serviceId: e.serviceId,
    externalId: e.externalId,
  }))
}

export async function createCalendarEvent(data: CreateCalendarEventInput) {
  const user = await getAuthUser()
  await ensurePermission("calendar.edit", user)
  const serviceId = data.serviceId || null

  if (serviceId) {
    const service = await db.service.findUnique({
      where: { id: serviceId },
      select: { churchId: true },
    })
    if (!service || service.churchId !== user.churchId) {
      throw new Error("Servicio no encontrado")
    }
  }

  const event = await db.calendarEvent.create({
    data: {
      churchId: user.churchId,
      title: data.title,
      date: new Date(data.date),
      time: data.time ?? null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      type: data.type,
      serviceId,
    },
  })

  return { id: event.id }
}

export async function updateCalendarEvent(id: string, data: UpdateCalendarEventInput) {
  const user = await getAuthUser()
  await ensurePermission("calendar.edit", user)
  const serviceId =
    data.serviceId === undefined ? undefined : data.serviceId || null

  const existing = await db.calendarEvent.findUnique({
    where: { id },
    select: { churchId: true },
  })
  if (!existing) throw new Error("Evento no encontrado")
  if (existing.churchId !== user.churchId) throw new Error("Sin acceso")

  if (serviceId) {
    const service = await db.service.findUnique({
      where: { id: serviceId },
      select: { churchId: true },
    })
    if (!service || service.churchId !== user.churchId) {
      throw new Error("Servicio no encontrado")
    }
  }

  const event = await db.calendarEvent.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.time !== undefined && { time: data.time }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.type !== undefined && { type: data.type }),
      ...(serviceId !== undefined && { serviceId }),
    },
  })

  return { id: event.id }
}
