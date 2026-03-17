import { getAuthUser } from "@/lib/actions/helpers"
import { getBackups } from "@/lib/actions/admin"
import BackupsClient from "./BackupsClient"

export default async function BackupsPage() {
  const user = await getAuthUser()
  if (user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Solo administradores pueden gestionar backups.
      </div>
    )
  }

  const backups = await getBackups(user.churchId)

  return <BackupsClient backups={backups} churchId={user.churchId} />
}
