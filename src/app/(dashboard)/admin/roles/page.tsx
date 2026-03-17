import { getAuthUser } from "@/lib/actions/helpers"
import { getUsers } from "@/lib/actions/admin"
import RolesClient from "./RolesClient"

export default async function RolesPage() {
  const user = await getAuthUser()
  if (user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Solo administradores pueden gestionar roles.
      </div>
    )
  }

  const users = await getUsers(user.churchId)

  return <RolesClient users={users} />
}
