"use server"

import { db } from "@/lib/db"
import type { ServiceStatus, ServiceType } from "@/generated/prisma"
import { ensurePermission, getAuthUser } from "./helpers"

// ---------- Types ----------

export interface ServicePreview {
  id: string
  date: Date
  time: string
  type: ServiceType
  status: ServiceStatus
  notes: string | null
  _count: { items: number; assignments: number }
  confirmed: number
  required: number
}

export interface ServiceDetail {
  id: string
  date: Date
  time: string
  type: ServiceType
  status: ServiceStatus
  notes: string | null
  items: {
    id: string
    order: number
    title: string
    duration: number | null
    type: string
    color: string | null
    notes: string | null
    parentId: string | null
    songs: {
      id: string
      order: number
      songName: string
      artist: string | null
      key: string | null
      notes: string | null
    }[]
    children: {
      id: string
      order: number
      title: string
      duration: number | null
      type: string
      color: string | null
      notes: string | null
    }[]
  }[]
  assignments: {
    id: string
    position: string | null
    status: string
    user: { id: string; name: string; avatar: string | null }
    team: { id: string; name: string; color: string }
  }[]
}

export interface CreateServiceInput {
  date: string
  time: string
  type: ServiceType
  notes?: string
}

export interface UpdateServiceInput {
  date?: string
  time?: string
  type?: ServiceType
  status?: ServiceStatus
  notes?: string
}

export interface CreateServiceItemInput {
  title: string
  order: number
  duration?: number
  type?: string
  color?: string
  notes?: string
  parentId?: string
}

export interface UpdateServiceItemInput {
  id: string
  order: number
  title?: string
  duration?: number | null
  type?: string
  color?: string | null
  notes?: string | null
}

// ---------- Actions ----------

export async function getServices(churchId: string): Promise<ServicePreview[]> {
  const user = await getAuthUser()
  await ensurePermission("services.view", user)
  if (user.churchId !== churchId) throw new Error("Sin acceso a esta iglesia")

  const services = await db.service.findMany({
    where: { churchId },
    orderBy: { date: "asc" },
    include: {
      _count: {
        select: { items: true, assignments: true },
      },
      assignments: {
        select: { status: true },
      },
    },
  })

  return services.map((s) => ({
    id: s.id,
    date: s.date,
    time: s.time,
    type: s.type,
    status: s.status,
    notes: s.notes,
    _count: s._count,
    confirmed: s.assignments.filter((a) => a.status === "CONFIRMED").length,
    required: s.assignments.length,
  }))
}

export async function getServiceById(id: string): Promise<ServiceDetail | null> {
  const user = await getAuthUser()
  await ensurePermission("services.view", user)

  const service = await db.service.findUnique({
    where: { id },
    include: {
      items: {
        where: { parentId: null },
        orderBy: { order: "asc" },
        include: {
          songs: { orderBy: { order: "asc" } },
          children: { orderBy: { order: "asc" } },
        },
      },
      assignments: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          team: { select: { id: true, name: true, color: true } },
        },
      },
    },
  })

  if (!service) return null
  if (service.churchId !== user.churchId) throw new Error("Sin acceso a este servicio")

  return {
    id: service.id,
    date: service.date,
    time: service.time,
    type: service.type,
    status: service.status,
    notes: service.notes,
    items: service.items.map((item) => ({
      id: item.id,
      order: item.order,
      title: item.title,
      duration: item.duration,
      type: item.type,
      color: item.color,
      notes: item.notes,
      parentId: item.parentId,
      songs: item.songs.map((s) => ({
        id: s.id,
        order: s.order,
        songName: s.songName,
        artist: s.artist,
        key: s.key,
        notes: s.notes,
      })),
      children: item.children.map((c) => ({
        id: c.id,
        order: c.order,
        title: c.title,
        duration: c.duration,
        type: c.type,
        color: c.color,
        notes: c.notes,
      })),
    })),
    assignments: service.assignments.map((a) => ({
      id: a.id,
      position: a.position,
      status: a.status,
      user: a.user,
      team: a.team,
    })),
  }
}

export async function createService(data: CreateServiceInput) {
  const user = await getAuthUser()
  await ensurePermission("services.edit", user)

  const service = await db.service.create({
    data: {
      churchId: user.churchId,
      date: new Date(data.date),
      time: data.time,
      type: data.type,
      notes: data.notes ?? null,
    },
  })

  return { id: service.id }
}

export async function updateService(id: string, data: UpdateServiceInput) {
  const user = await getAuthUser()
  await ensurePermission("services.edit", user)
  if (data.status === "PUBLISHED") {
    await ensurePermission("services.publish", user)
  }

  const existing = await db.service.findUnique({ where: { id }, select: { churchId: true } })
  if (!existing) throw new Error("Servicio no encontrado")
  if (existing.churchId !== user.churchId) throw new Error("Sin acceso")

  const service = await db.service.update({
    where: { id },
    data: {
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.time !== undefined && { time: data.time }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  })

  return { id: service.id }
}

export async function createServiceItem(serviceId: string, data: CreateServiceItemInput) {
  const user = await getAuthUser()
  await ensurePermission("services.edit", user)
  const parentId = data.parentId || null

  const service = await db.service.findUnique({ where: { id: serviceId }, select: { churchId: true } })
  if (!service) throw new Error("Servicio no encontrado")
  if (service.churchId !== user.churchId) throw new Error("Sin acceso")

  if (parentId) {
    const parent = await db.serviceItem.findUnique({
      where: { id: parentId },
      select: {
        service: {
          select: { id: true, churchId: true },
        },
      },
    })
    if (!parent || parent.service.churchId !== user.churchId || parent.service.id !== serviceId) {
      throw new Error("Bloque padre inválido")
    }
  }

  const item = await db.serviceItem.create({
    data: {
      serviceId,
      title: data.title,
      order: data.order,
      duration: data.duration ?? null,
      type: data.type ?? "general",
      color: data.color ?? null,
      notes: data.notes ?? null,
      parentId,
    },
  })

  return { id: item.id }
}

export async function updateServiceItems(serviceId: string, items: UpdateServiceItemInput[]) {
  const user = await getAuthUser()
  await ensurePermission("services.edit", user)

  const service = await db.service.findUnique({ where: { id: serviceId }, select: { churchId: true } })
  if (!service) throw new Error("Servicio no encontrado")
  if (service.churchId !== user.churchId) throw new Error("Sin acceso")

  const uniqueIds = [...new Set(items.map((item) => item.id))]
  const existingItems = await db.serviceItem.findMany({
    where: { id: { in: uniqueIds }, serviceId },
    select: { id: true },
  })
  if (existingItems.length !== uniqueIds.length) {
    throw new Error("Uno o más bloques no pertenecen al servicio indicado")
  }

  await db.$transaction(
    items.map((item) =>
      db.serviceItem.update({
        where: { id: item.id },
        data: {
          order: item.order,
          ...(item.title !== undefined && { title: item.title }),
          ...(item.duration !== undefined && { duration: item.duration }),
          ...(item.type !== undefined && { type: item.type }),
          ...(item.color !== undefined && { color: item.color }),
          ...(item.notes !== undefined && { notes: item.notes }),
        },
      })
    )
  )

  return { success: true }
}

export async function deleteServiceItem(id: string) {
  const user = await getAuthUser()
  await ensurePermission("services.edit", user)

  const item = await db.serviceItem.findUnique({
    where: { id },
    include: { service: { select: { churchId: true } } },
  })
  if (!item) throw new Error("Item no encontrado")
  if (item.service.churchId !== user.churchId) throw new Error("Sin acceso")

  await db.serviceItem.delete({ where: { id } })

  return { success: true }
}
