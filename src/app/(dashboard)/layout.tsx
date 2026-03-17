import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { PermissionProvider } from "@/components/providers/permission-provider"
import { getCurrentUserOrDevFallback } from "@/lib/current-user"
import { getUserPermissions } from "@/lib/permissions"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserOrDevFallback()
  if (!user) {
    redirect("/login")
  }

  const permissions = await getUserPermissions(user.id)

  return (
    <PermissionProvider permissions={permissions} role={user.role}>
      <div className="min-h-screen bg-background">
        <Sidebar className="hidden lg:flex" />
        <div className="lg:pl-64">
          <Header />
          <main className="p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
        </div>
        <BottomNav className="lg:hidden" />
      </div>
    </PermissionProvider>
  )
}
