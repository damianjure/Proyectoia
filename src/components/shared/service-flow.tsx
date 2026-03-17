"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Music,
  FileText,
  Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BlockEditorDialog } from "./block-editor-dialog"

export interface SubItem {
  id: string
  songName: string
  artist: string
  key: string
  notes: string
}

export interface FlowItem {
  id: string
  title: string
  duration: number
  type: string
  color: string
  notes: string
  subItems: SubItem[]
  responsible?: string
}

const TYPE_COLORS: Record<string, string> = {
  alabanza:    "#8B5CF6",
  predicacion: "#6366F1",
  oracion:     "#3B82F6",
  anuncios:    "#F59E0B",
  bienvenida:  "#10B981",
  general:     "#6B7280",
}

function SortableFlowItem({
  item,
  onUpdate,
  onRemove,
  onToggleExpand,
  expanded,
  onAddSubItem,
  onUpdateSubItem,
  onRemoveSubItem,
  onEdit,
}: {
  item: FlowItem
  onUpdate: (id: string, updates: Partial<FlowItem>) => void
  onRemove: (id: string) => void
  onToggleExpand: (id: string) => void
  expanded: boolean
  onAddSubItem: (parentId: string) => void
  onUpdateSubItem: (parentId: string, subId: string, updates: Partial<SubItem>) => void
  onRemoveSubItem: (parentId: string, subId: string) => void
  onEdit: (item: FlowItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const hasSubItems = item.subItems.length > 0
  const isAlabanza = item.type === "alabanza"
  const subItemIcon = isAlabanza ? Music : FileText

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          className="cursor-grab text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div
          className="h-8 w-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: item.color || TYPE_COLORS[item.type] || TYPE_COLORS.general }}
        />

        {/* Expand toggle — available for ALL block types */}
        <button
          onClick={() => onToggleExpand(item.id)}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="flex flex-1 flex-col min-w-0">
          <Input
            value={item.title}
            onChange={(e) => onUpdate(item.id, { title: e.target.value })}
            className="border-0 bg-transparent px-1 font-medium shadow-none focus-visible:ring-0 h-7"
            placeholder="Nombre del bloque"
          />
          {item.responsible && (
            <span className="px-1 text-xs text-muted-foreground truncate">
              👤 {item.responsible}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <Input
            type="number"
            value={item.duration}
            onChange={(e) =>
              onUpdate(item.id, { duration: parseInt(e.target.value) || 0 })
            }
            className="w-14 border-0 bg-transparent px-1 text-right shadow-none focus-visible:ring-0"
          />
          <span className="text-xs">min</span>
        </div>

        {/* Edit button — opens popup */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(item)}
          title="Editar bloque"
        >
          <Pencil className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Sub-items (expanded) */}
      {expanded && (
        <div className="border-t px-4 py-3 pl-12 space-y-2">
          {item.subItems.map((sub, i) => {
            const SubIcon = subItemIcon
            return (
              <div
                key={sub.id}
                className="flex items-center gap-2 rounded border bg-background p-2"
              >
                <span className="text-xs text-muted-foreground w-4">
                  {i + 1}.
                </span>
                <SubIcon className="h-3 w-3 text-muted-foreground" />
                <Input
                  value={sub.songName}
                  onChange={(e) =>
                    onUpdateSubItem(item.id, sub.id, { songName: e.target.value })
                  }
                  placeholder={isAlabanza ? "Canción" : "Título"}
                  className="flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
                />
                {isAlabanza && (
                  <>
                    <Input
                      value={sub.artist}
                      onChange={(e) =>
                        onUpdateSubItem(item.id, sub.id, { artist: e.target.value })
                      }
                      placeholder="Artista"
                      className="w-28 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
                    />
                    <Input
                      value={sub.key}
                      onChange={(e) =>
                        onUpdateSubItem(item.id, sub.id, { key: e.target.value })
                      }
                      placeholder="Key"
                      className="w-14 border-0 bg-transparent px-1 text-sm text-center shadow-none focus-visible:ring-0"
                    />
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onRemoveSubItem(item.id, sub.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
          {!hasSubItems && (
            <p className="text-xs text-muted-foreground text-center py-1">
              Sin sub-ítems. Editá el bloque para agregar.
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddSubItem(item.id)}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Agregar {item.type === "alabanza" ? "canción" : "sub-ítem"}
          </Button>
        </div>
      )}
    </div>
  )
}

let nextId = 100
function generateId() {
  return `item-${nextId++}`
}

const DEFAULT_FLOW: FlowItem[] = [
  { id: "item-1", title: "Bienvenida",     duration: 5,  type: "bienvenida",  color: TYPE_COLORS.bienvenida,  notes: "", subItems: [] },
  { id: "item-2", title: "Alabanza",       duration: 20, type: "alabanza",    color: TYPE_COLORS.alabanza,    notes: "", subItems: [] },
  { id: "item-3", title: "Anuncios",       duration: 5,  type: "anuncios",    color: TYPE_COLORS.anuncios,    notes: "", subItems: [] },
  { id: "item-4", title: "Predicación",    duration: 30, type: "predicacion", color: TYPE_COLORS.predicacion, notes: "", subItems: [] },
  { id: "item-5", title: "Oración final",  duration: 10, type: "oracion",     color: TYPE_COLORS.oracion,     notes: "", subItems: [] },
  { id: "item-6", title: "Despedida",      duration: 5,  type: "general",     color: TYPE_COLORS.general,     notes: "", subItems: [] },
]

export function ServiceFlow({
  initialItems,
}: {
  initialItems?: FlowItem[]
}) {
  const [items, setItems] = useState<FlowItem[]>(initialItems ?? DEFAULT_FLOW)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  // Dialog state
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editingItem, setEditingItem] = useState<FlowItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        setItems((prev) => {
          const oldIndex = prev.findIndex((i) => i.id === active.id)
          const newIndex = prev.findIndex((i) => i.id === over.id)
          return arrayMove(prev, oldIndex, newIndex)
        })
      }
    },
    []
  )

  const updateItem = useCallback((id: string, updates: Partial<FlowItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const openNewBlock = useCallback(() => {
    setEditingItem(null)
    setDialogOpen(true)
  }, [])

  const openEditBlock = useCallback((item: FlowItem) => {
    setEditingItem(item)
    setDialogOpen(true)
  }, [])

  const handleDialogSave = useCallback((saved: FlowItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === saved.id)
      if (exists) return prev.map((i) => (i.id === saved.id ? saved : i))
      return [...prev, saved]
    })
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const addSubItem = useCallback((parentId: string) => {
    const newSub: SubItem = {
      id: generateId(),
      songName: "",
      artist: "",
      key: "",
      notes: "",
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === parentId
          ? { ...item, subItems: [...item.subItems, newSub] }
          : item
      )
    )
    setExpandedIds((prev) => new Set(prev).add(parentId))
  }, [])

  const updateSubItem = useCallback(
    (parentId: string, subId: string, updates: Partial<SubItem>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === parentId
            ? {
                ...item,
                subItems: item.subItems.map((s) =>
                  s.id === subId ? { ...s, ...updates } : s
                ),
              }
            : item
        )
      )
    },
    []
  )

  const removeSubItem = useCallback((parentId: string, subId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === parentId
          ? { ...item, subItems: item.subItems.filter((s) => s.id !== subId) }
          : item
      )
    )
  }, [])

  const totalDuration = items.reduce((sum, item) => sum + item.duration, 0)

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item) => (
              <SortableFlowItem
                key={item.id}
                item={item}
                onUpdate={updateItem}
                onRemove={removeItem}
                onToggleExpand={toggleExpand}
                expanded={expandedIds.has(item.id)}
                onAddSubItem={addSubItem}
                onUpdateSubItem={updateSubItem}
                onRemoveSubItem={removeSubItem}
                onEdit={openEditBlock}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button variant="outline" onClick={openNewBlock} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Agregar bloque
      </Button>

      {items.length > 0 && (
        <div className="flex items-center justify-end rounded-lg border bg-muted/40 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Duración total:</span>
            <span className="font-semibold">
              {totalDuration >= 60
                ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60 > 0 ? `${totalDuration % 60}m` : ""}`
                : `${totalDuration} min`}
            </span>
            <span className="text-xs text-muted-foreground">({totalDuration} min)</span>
          </div>
        </div>
      )}

      <BlockEditorDialog
        key={`${dialogOpen ? "open" : "closed"}-${editingItem?.id ?? "new"}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        onSave={handleDialogSave}
      />
    </div>
  )
}
