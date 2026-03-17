"use client"

import { useRouter } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Music,
  CalendarPlus,
  MessageSquare,
  UserPlus,
  Settings,
} from "lucide-react"
import {
  QUICK_ACTION_ITEMS,
  filterNavigationItems,
  type NavIconKey,
} from "@/lib/navigation"

interface QuickActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ICONS: Record<NavIconKey, typeof Music> = {
  dashboard: Music,
  services: Music,
  teams: UserPlus,
  calendar: CalendarPlus,
  messages: MessageSquare,
  reports: MessageSquare,
  settings: Settings,
  "service-create": Music,
  "event-create": CalendarPlus,
  "message-create": MessageSquare,
  "person-add": UserPlus,
}

const STYLES: Record<
  NavIconKey,
  { color: string; bg: string }
> = {
  dashboard: { color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950" },
  services: { color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950" },
  teams: { color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950" },
  calendar: { color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950" },
  messages: { color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
  reports: { color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
  settings: { color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-950" },
  "service-create": {
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950",
  },
  "event-create": {
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950",
  },
  "message-create": {
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950",
  },
  "person-add": {
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950",
  },
}

export function QuickActionsSheet({ open, onOpenChange }: QuickActionsSheetProps) {
  const router = useRouter()
  const { permissions } = usePermissions()
  const actions = filterNavigationItems(QUICK_ACTION_ITEMS, permissions)

  function navigate(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle>Acciones rápidas</SheetTitle>
        </SheetHeader>
        {actions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay acciones rápidas disponibles para tu rol.
          </p>
        ) : (
          <div className="space-y-2">
            {actions.map((action) => {
              const Icon = ICONS[action.icon]
              const style = STYLES[action.icon]
              return (
                <Button
                  key={action.label}
                  variant="ghost"
                  className="w-full justify-start h-auto py-3 px-3 hover:bg-accent"
                  onClick={() => navigate(action.href)}
                >
                  <div className={`rounded-xl p-2 mr-3 ${style.bg}`}>
                    <Icon className={`h-5 w-5 ${style.color}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </Button>
              )
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
