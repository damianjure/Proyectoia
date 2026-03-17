"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"

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

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { permissions } = usePermissions()
  const navItems = filterNavigationItems(DASHBOARD_NAV_ITEMS, permissions)

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 border-r bg-card flex flex-col",
        className
      )}
    >
      <div className="p-6 font-bold text-lg">Church Planning Hub</div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon]
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
