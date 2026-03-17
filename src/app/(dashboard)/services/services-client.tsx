"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { createService, updateService } from "@/lib/actions/services"
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Music,
  Plus,
  Printer,
  Save,
  Send,
  Users,
} from "lucide-react"

interface ServiceItemPreview {
  id: string
  title: string
  duration: number | null
  notes: string
  type: string
  songs: {
    id: string
    title: string
    detail: string
  }[]
  children: {
    id: string
    title: string
    duration: number | null
    notes: string
    type: string
  }[]
}

interface ServicePreview {
  id: string
  date: string
  time: string
  type: string
  status: "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED"
  notes: string
  confirmed: number
  required: number
  items: ServiceItemPreview[]
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
}

const STATUS_VARIANTS: Record<
  string,
  "secondary" | "default" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
}

interface ServicesClientProps {
  services: ServicePreview[]
  canEdit: boolean
  canPublish: boolean
}

interface ServiceFormState {
  date: string
  time: string
  type: "REGULAR" | "SANTA_CENA" | "ESPECIAL"
  notes: string
}

const EMPTY_CREATE_FORM: ServiceFormState = {
  date: "",
  time: "10:00",
  type: "REGULAR",
  notes: "",
}

export default function ServicesClient({
  services,
  canEdit,
  canPublish,
}: ServicesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pastOpen, setPastOpen] = useState(false)

  const today = new Date().toISOString().split("T")[0]
  const upcomingServices = services.filter((s) => s.date >= today)
  const pastServices = services.filter((s) => s.date < today).reverse()

  const [selectedId, setSelectedId] = useState<string | null>(
    upcomingServices[0]?.id ?? services[0]?.id ?? null
  )
  const [form, setForm] = useState<ServiceFormState>(() => {
    const selected = services[0]
    return selected
      ? {
          date: selected.date,
          time: selected.time,
          type: selected.type as ServiceFormState["type"],
          notes: selected.notes,
        }
      : EMPTY_CREATE_FORM
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<ServiceFormState>(EMPTY_CREATE_FORM)
  const [error, setError] = useState("")

  const selected = services.find((service) => service.id === selectedId) ?? null

  const isDirty =
    !!selected &&
    (form.date !== selected.date ||
      form.time !== selected.time ||
      form.type !== selected.type ||
      form.notes !== selected.notes)

  function updateForm<K extends keyof ServiceFormState>(
    key: K,
    value: ServiceFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateCreateForm<K extends keyof ServiceFormState>(
    key: K,
    value: ServiceFormState[K]
  ) {
    setCreateForm((current) => ({ ...current, [key]: value }))
  }

  function resetCreateForm() {
    setCreateForm(EMPTY_CREATE_FORM)
    setError("")
  }

  function handleSelectService(service: ServicePreview) {
    setSelectedId(service.id)
    setForm({
      date: service.date,
      time: service.time,
      type: service.type as ServiceFormState["type"],
      notes: service.notes,
    })
    setError("")
  }

  function handleCreateService() {
    if (!createForm.date || !createForm.time) {
      setError("Fecha y hora son obligatorias.")
      return
    }

    setError("")
    startTransition(async () => {
      try {
        await createService(createForm)
        setCreateOpen(false)
        resetCreateForm()
        router.refresh()
      } catch (createError) {
        setError(
          createError instanceof Error
            ? createError.message
            : "No se pudo crear el servicio."
        )
      }
    })
  }

  function handleSaveChanges(status?: ServicePreview["status"]) {
    if (!selected) return

    setError("")
    startTransition(async () => {
      try {
        await updateService(selected.id, {
          date: form.date,
          time: form.time,
          type: form.type,
          notes: form.notes,
          ...(status ? { status } : {}),
        })
        router.refresh()
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "No se pudo guardar el servicio."
        )
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Servicios</h1>
        {canEdit ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo servicio
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {/* Servicios anteriores */}
          {pastServices.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-3">
                <button
                  onClick={() => setPastOpen((v) => !v)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <CardTitle className="text-sm text-muted-foreground">
                    Servicios anteriores ({pastServices.length})
                  </CardTitle>
                  {pastOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CardHeader>
              {pastOpen && (
                <CardContent className="space-y-2 pt-0">
                  {pastServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleSelectService(service)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors opacity-70 ${
                        selectedId === service.id
                          ? "border-primary bg-primary/5 opacity-100"
                          : "hover:bg-accent hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {new Date(service.date).toLocaleDateString("es-AR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <Badge variant={STATUS_VARIANTS[service.status] ?? "secondary"}>
                          {STATUS_LABELS[service.status] ?? service.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {service.time} · {service.type} · {service.confirmed}/
                        {service.required} confirmados
                      </div>
                    </button>
                  ))}
                </CardContent>
              )}
            </Card>
          )}

          {/* Próximos servicios */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Próximos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {upcomingServices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay servicios próximos.
                </p>
              ) : (
                upcomingServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleSelectService(service)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedId === service.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {new Date(service.date).toLocaleDateString("es-AR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <Badge variant={STATUS_VARIANTS[service.status] ?? "secondary"}>
                        {STATUS_LABELS[service.status] ?? service.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {service.time} · {service.type} · {service.confirmed}/
                      {service.required} confirmados
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          {selected ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Detalle del servicio</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Imprimir
                    </Button>
                    {canEdit ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending || !isDirty}
                        onClick={() => handleSaveChanges()}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Guardar
                      </Button>
                    ) : null}
                    {canPublish && selected.status !== "PUBLISHED" ? (
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleSaveChanges("PUBLISHED")}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Publicar
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={form.date}
                      disabled={!canEdit || isPending}
                      onChange={(event) => updateForm("date", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Hora</Label>
                    <Input
                      type="time"
                      value={form.time}
                      disabled={!canEdit || isPending}
                      onChange={(event) => updateForm("time", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <select
                      value={form.type}
                      disabled={!canEdit || isPending}
                      onChange={(event) =>
                        updateForm(
                          "type",
                          event.target.value as ServiceFormState["type"]
                        )
                      }
                      className="w-full rounded-md border px-3 py-2 text-sm bg-background disabled:opacity-60"
                    >
                      <option value="REGULAR">Regular</option>
                      <option value="SANTA_CENA">Santa Cena</option>
                      <option value="ESPECIAL">Especial</option>
                    </select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-medium">Flujo del servicio</h3>
                  {selected.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Este servicio todavía no tiene bloques configurados.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selected.items.map((item, index) => (
                        <div key={item.id} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {index + 1}. {item.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.type}
                                {item.duration ? ` · ${item.duration} min` : ""}
                              </p>
                            </div>
                            <Clock3 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          {item.notes ? (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {item.notes}
                            </p>
                          ) : null}
                          {item.songs.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {item.songs.map((song) => (
                                <div
                                  key={song.id}
                                  className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
                                >
                                  <Music className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{song.title}</span>
                                  {song.detail ? (
                                    <span className="text-xs text-muted-foreground">
                                      {song.detail}
                                    </span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {item.children.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {item.children.map((child) => (
                                <div
                                  key={child.id}
                                  className="rounded-md bg-muted/40 px-2 py-1.5 text-sm"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span>{child.title}</span>
                                    {child.duration ? (
                                      <span className="text-xs text-muted-foreground">
                                        {child.duration} min
                                      </span>
                                    ) : null}
                                  </div>
                                  {child.notes ? (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {child.notes}
                                    </p>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Notas del servicio</Label>
                    <textarea
                      value={form.notes}
                      disabled={!canEdit || isPending}
                      onChange={(event) => updateForm("notes", event.target.value)}
                      className="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
                      placeholder="Notas para el equipo..."
                    />
                  </div>

                  {/* Caja de gente */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Equipo del servicio
                    </Label>
                    <div className="rounded-lg border bg-background p-4 space-y-4 min-h-[100px]">
                      {selected.required === 0 ? (
                        <p className="text-sm text-muted-foreground text-center pt-4">
                          Sin asignaciones todavía.
                        </p>
                      ) : (
                        <>
                          {/* Confirmados */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                                Confirmados
                              </span>
                              <span className="font-semibold text-green-600">
                                {selected.confirmed}/{selected.required}
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-green-500 transition-all"
                                style={{
                                  width: `${selected.required > 0 ? Math.round((selected.confirmed / selected.required) * 100) : 0}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Pendientes */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                                Por confirmar
                              </span>
                              <span className="font-semibold text-amber-600">
                                {selected.required - selected.confirmed}/{selected.required}
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-400 transition-all"
                                style={{
                                  width: `${selected.required > 0 ? Math.round(((selected.required - selected.confirmed) / selected.required) * 100) : 0}%`,
                                }}
                              />
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground text-center">
                            {selected.required > 0
                              ? `${Math.round((selected.confirmed / selected.required) * 100)}% del equipo confirmado`
                              : ""}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center py-20">
              <div className="text-center text-muted-foreground">
                <FileText className="mx-auto mb-3 h-5 w-5" />
                Seleccioná un servicio para ver el detalle.
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetCreateForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo servicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={createForm.date}
                onChange={(event) => updateCreateForm("date", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input
                type="time"
                value={createForm.time}
                onChange={(event) => updateCreateForm("time", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select
                value={createForm.type}
                onChange={(event) =>
                  updateCreateForm(
                    "type",
                    event.target.value as ServiceFormState["type"]
                  )
                }
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                <option value="REGULAR">Regular</option>
                <option value="SANTA_CENA">Santa Cena</option>
                <option value="ESPECIAL">Especial</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <textarea
                value={createForm.notes}
                onChange={(event) =>
                  updateCreateForm("notes", event.target.value)
                }
                className="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Notas internas del servicio..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateService} disabled={isPending}>
              {isPending ? "Creando..." : "Crear servicio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
