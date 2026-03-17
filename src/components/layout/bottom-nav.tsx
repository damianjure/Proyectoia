"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"
import {
  DASHBOARD_NAV_ITEMS,
  filterNavigationItems,
  type NavIconKey,
} from "@/lib/navigation"
import {
  LayoutDashboard,
  Music,
  Users,
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react"
import { QuickActionsSheet } from "@/components/shared/quick-actions-sheet"

const ICONS: Record<NavIconKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  services: Music,
  teams: Users,
  calendar: Calendar,
  messages: MessageSquare,
  reports: BarChart3,
  settings: Settings,
  "service-create": Music,
  "event-create": Calendar,
  "message-create": MessageSquare,
  "person-add": Users,
}

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)
  const { permissions } = usePermissions()
  const mobileNavItems = filterNavigationItems(DASHBOARD_NAV_ITEMS, permissions)
    .filter((item) =>
      ["/", "/services", "/teams", "/messages"].includes(item.href)
    )
    .map((item) => ({
      ...item,
      label:
        item.href === "/"
          ? "Inicio"
          : item.href === "/messages"
            ? "Chat"
            : item.label,
    }))

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 inset-x-0 z-30 border-t bg-card",
          className
        )}
      >
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            const Icon = ICONS[item.icon]
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 text-xs transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}

          {/* Botón + central — acciones rápidas */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <Plus className="h-5 w-5" />
            </div>
            <span className="mt-0.5">Nuevo</span>
          </button>
        </div>
      </nav>

      <QuickActionsSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
