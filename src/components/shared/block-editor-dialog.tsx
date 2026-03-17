"use client"

import { useState } from "react"
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
import { Plus, Trash2, Music, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FlowItem, SubItem } from "./service-flow"

const BLOCK_TYPES = [
  { value: "alabanza",    label: "Alabanza",    color: "#8B5CF6", subLabel: "canción" },
  { value: "predicacion", label: "Predicación", color: "#6366F1", subLabel: "punto" },
  { value: "oracion",     label: "Oración",     color: "#3B82F6", subLabel: "punto de oración" },
  { value: "anuncios",    label: "Anuncios",    color: "#F59E0B", subLabel: "anuncio" },
  { value: "bienvenida",  label: "Bienvenida",  color: "#10B981", subLabel: "item" },
  { value: "general",     label: "General",     color: "#6B7280", subLabel: "item" },
]

interface BlockEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** If provided, edit mode. If null, create mode. */
  item: FlowItem | null
  onSave: (item: FlowItem) => void
  /** Members of the church for responsible assignment */
  members?: { id: string; name: string }[]
}

function generateId() {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getInitialState(item: FlowItem | null) {
  if (item) {
    return {
      type: item.type,
      title: item.title,
      duration: item.duration,
      notes: item.notes ?? "",
      responsible: "",
      subItems: item.subItems ?? [],
    }
  }

  return {
    type: "general",
    title: "",
    duration: 5,
    notes: "",
    responsible: "",
    subItems: [] as SubItem[],
  }
}

export function BlockEditorDialog({
  open,
  onOpenChange,
  item,
  onSave,
  members = [],
}: BlockEditorDialogProps) {
  const initialState = getInitialState(item)
  const [type, setType] = useState(initialState.type)
  const [title, setTitle] = useState(initialState.title)
  const [duration, setDuration] = useState(initialState.duration)
  const [notes, setNotes] = useState(initialState.notes)
  const [responsible, setResponsible] = useState(initialState.responsible)
  const [subItems, setSubItems] = useState<SubItem[]>(initialState.subItems)

  const blockType = BLOCK_TYPES.find((b) => b.value === type) ?? BLOCK_TYPES[5]

  function addSubItem() {
    setSubItems((prev) => [
      ...prev,
      { id: generateId(), songName: "", artist: "", key: "", notes: "" },
    ])
  }

  function updateSubItem(id: string, key: keyof SubItem, value: string) {
    setSubItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    )
  }

  function removeSubItem(id: string) {
    setSubItems((prev) => prev.filter((s) => s.id !== id))
  }

  function handleSave() {
    const saved: FlowItem = {
      id: item?.id ?? `item-${Date.now()}`,
      title: title || blockType.label,
      duration,
      type,
      color: blockType.color,
      notes,
      subItems,
    }
    onSave(saved)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar bloque" : "Nuevo bloque"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Type selector */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="grid grid-cols-3 gap-2">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.value}
                  type="button"
                  onClick={() => setType(bt.value)}
                  className={cn(
                    "rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
                    type === bt.value
                      ? "border-transparent text-white shadow-md"
                      : "border-muted bg-background text-muted-foreground hover:border-muted-foreground"
                  )}
                  style={type === bt.value ? { backgroundColor: bt.color } : {}}
                >
                  {bt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="block-title">Título</Label>
            <Input
              id="block-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={blockType.label}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="block-duration">Duración (minutos)</Label>
            <Input
              id="block-duration"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              className="w-32"
            />
          </div>

          {/* Responsible */}
          <div className="space-y-2">
            <Label htmlFor="block-responsible">Responsable</Label>
            {members.length > 0 ? (
              <select
                id="block-responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Sin asignar</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="block-responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Nombre del responsable"
              />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="block-notes">Notas</Label>
            <textarea
              id="block-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas internas del bloque..."
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            />
          </div>

          {/* Sub-items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Sub-ítems
                <span className="ml-1 text-xs text-muted-foreground font-normal">
                  ({blockType.subLabel}s)
                </span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addSubItem}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar {blockType.subLabel}
              </Button>
            </div>

            {subItems.length === 0 ? (
              <div
                className="rounded-lg border-2 border-dashed py-4 text-center text-xs text-muted-foreground cursor-pointer hover:border-muted-foreground transition-colors"
                onClick={addSubItem}
              >
                Clic para agregar un {blockType.subLabel}
              </div>
            ) : (
              <div className="space-y-2">
                {subItems.map((sub, i) => (
                  <div
                    key={sub.id}
                    className="flex items-start gap-2 rounded-lg border bg-muted/30 p-2"
                  >
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground w-4">
                      {i + 1}.
                    </div>
                    {type === "alabanza" ? (
                      <Music className="h-3.5 w-3.5 text-muted-foreground mt-2 flex-shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-muted-foreground mt-2 flex-shrink-0" />
                    )}
                    <div className="flex-1 space-y-1">
                      <Input
                        value={sub.songName}
                        onChange={(e) => updateSubItem(sub.id, "songName", e.target.value)}
                        placeholder={type === "alabanza" ? "Nombre de la canción" : "Título"}
                        className="h-7 text-xs border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                      />
                      {type === "alabanza" && (
                        <div className="flex gap-1">
                          <Input
                            value={sub.artist}
                            onChange={(e) => updateSubItem(sub.id, "artist", e.target.value)}
                            placeholder="Artista"
                            className="h-7 text-xs border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                          />
                          <Input
                            value={sub.key}
                            onChange={(e) => updateSubItem(sub.id, "key", e.target.value)}
                            placeholder="Key"
                            className="h-7 w-16 text-xs border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 text-center"
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => removeSubItem(sub.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            style={{ backgroundColor: blockType.color }}
            className="text-white hover:opacity-90"
          >
            {item ? "Guardar cambios" : "Agregar bloque"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
