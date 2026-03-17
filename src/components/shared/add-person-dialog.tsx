"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

// Flow item type tags — all blocks types + custom tags
const FLOW_TAGS = [
  { name: "Alabanza",    color: "#8B5CF6", sub: ["Voz principal", "Coros", "Guitarra", "Piano", "Batería", "Bajo", "Sonido"] },
  { name: "Predicación", color: "#6366F1", sub: ["Predicador principal", "Expositor invitado"] },
  { name: "Oración",     color: "#3B82F6", sub: ["Intercesión", "Liberación", "Sanidad"] },
  { name: "Anuncios",    color: "#F59E0B", sub: ["Presentador", "Gráficos"] },
  { name: "Bienvenida",  color: "#10B981", sub: ["Recepción", "Acomodadores"] },
  { name: "Técnica",     color: "#EC4899", sub: ["Proyección", "Streaming", "Fotografía"] },
  { name: "Infantil",    color: "#F97316", sub: ["Maestro", "Asistente"] },
]

interface AddPersonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teams?: { id: string; name: string; color: string }[]
  onSuccess?: () => void
}

type SelectedTag = { tag: string; sub: string }

export function AddPersonDialog({
  open,
  onOpenChange,
  teams = [],
  onSuccess,
}: AddPersonDialogProps) {
  const [name, setName]           = useState("")
  const [email, setEmail]         = useState("")
  const [phone, setPhone]         = useState("")
  const [role, setRole]           = useState("COLABORADOR")
  const [teamId, setTeamId]       = useState("")
  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([])
  const [expandedTag, setExpandedTag]   = useState<string | null>(null)
  const [isPending, startTransition]    = useTransition()
  const [error, setError]         = useState("")

  function toggleSubTag(tagName: string, subName: string) {
    setSelectedTags((prev) => {
      const exists = prev.find((t) => t.tag === tagName && t.sub === subName)
      if (exists) return prev.filter((t) => !(t.tag === tagName && t.sub === subName))
      return [...prev, { tag: tagName, sub: subName }]
    })
  }

  function removeTag(tag: string, sub: string) {
    setSelectedTags((prev) => prev.filter((t) => !(t.tag === tag && t.sub === sub)))
  }

  function reset() {
    setName(""); setEmail(""); setPhone(""); setRole("COLABORADOR")
    setTeamId(""); setSelectedTags([]); setExpandedTag(null); setError("")
  }

  function handleClose(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  async function handleSave() {
    if (!name.trim() || !email.trim()) {
      setError("Nombre y email son obligatorios.")
      return
    }
    setError("")

    startTransition(async () => {
      try {
        const res = await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, role, teamId: teamId || null, tags: selectedTags }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? "Error al guardar.")
          return
        }
        reset()
        onOpenChange(false)
        onSuccess?.()
      } catch {
        setError("Error de red. Intentá de nuevo.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar persona</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="person-name">Nombre completo *</Label>
              <Input
                id="person-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan García"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="person-email">Email *</Label>
              <Input
                id="person-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@iglesia.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="person-phone">Teléfono</Label>
              <Input
                id="person-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 9 11 ..."
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="person-role">Rol en la plataforma</Label>
            <select
              id="person-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ADMIN">Admin</option>
              <option value="RESPONSABLE">Responsable</option>
              <option value="COLABORADOR">Colaborador</option>
              <option value="INVITADO">Invitado</option>
            </select>
          </div>

          {/* Team */}
          {teams.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="person-team">Equipo</Label>
              <select
                id="person-team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sin equipo</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tags del flujo de servicio */}
          <div className="space-y-2">
            <Label>
              Etiquetas del flujo de servicio
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (subtemas)
              </span>
            </Label>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pb-1">
                {selectedTags.map((t) => (
                  <Badge
                    key={`${t.tag}-${t.sub}`}
                    variant="outline"
                    className="gap-1 pr-1 text-xs"
                  >
                    {t.tag} · {t.sub}
                    <button
                      type="button"
                      onClick={() => removeTag(t.tag, t.sub)}
                      className="rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Tag expanders */}
            <div className="space-y-1.5 rounded-lg border p-2">
              {FLOW_TAGS.map((ft) => (
                <div key={ft.name}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm font-medium hover:bg-accent"
                    onClick={() => setExpandedTag(expandedTag === ft.name ? null : ft.name)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: ft.color }}
                      />
                      {ft.name}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {selectedTags.filter((t) => t.tag === ft.name).length > 0
                        ? `${selectedTags.filter((t) => t.tag === ft.name).length} sel.`
                        : "▾"}
                    </span>
                  </button>
                  {expandedTag === ft.name && (
                    <div className="ml-4 mt-1 flex flex-wrap gap-1.5 pb-1">
                      {ft.sub.map((s) => {
                        const active = selectedTags.some(
                          (t) => t.tag === ft.name && t.sub === s
                        )
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSubTag(ft.name, s)}
                            className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                              active
                                ? "text-white border-transparent"
                                : "border-muted text-muted-foreground hover:border-foreground"
                            }`}
                            style={active ? { backgroundColor: ft.color } : {}}
                          >
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Guardando..." : "Agregar persona"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
