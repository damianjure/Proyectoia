import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { getAuthUser } from "@/lib/actions/helpers"
import ServicesClient from "./services-client"

export default async function ServicesPage() {
  const user = await getAuthUser()
  const canView = await hasPermission(user.id, "services.view")
  if (!canView) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No tenés permisos para ver servicios.</p>
      </div>
    )
  }

  const rawServices = await db.service.findMany({
    where: { churchId: user.churchId },
    orderBy: { date: "asc" },
    include: {
      assignments: {
        select: { status: true },
      },
      items: {
        where: { parentId: null },
        orderBy: { order: "asc" },
        include: {
          songs: {
            orderBy: { order: "asc" },
          },
          children: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              duration: true,
              notes: true,
              type: true,
            },
          },
        },
      },
    },
  })

  const services = rawServices.map((s) => ({
    id: s.id,
    date: s.date.toISOString().split("T")[0],
    time: s.time,
    type: s.type,
    status: s.status,
    notes: s.notes ?? "",
    confirmed: s.assignments.filter((a) => a.status === "CONFIRMED").length,
    required: s.assignments.length,
    items: s.items.map((item) => ({
      id: item.id,
      title: item.title,
      duration: item.duration,
      notes: item.notes ?? "",
      type: item.type,
      songs: item.songs.map((song) => ({
        id: song.id,
        title: song.songName,
        detail: [song.artist, song.key].filter(Boolean).join(" · "),
      })),
      children: item.children.map((child) => ({
        id: child.id,
        title: child.title,
        duration: child.duration,
        notes: child.notes ?? "",
        type: child.type,
      })),
    })),
  }))

  return (
    <ServicesClient
      services={services}
      canEdit={await hasPermission(user.id, "services.edit")}
      canPublish={await hasPermission(user.id, "services.publish")}
    />
  )
}
