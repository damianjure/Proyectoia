import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { isDevAuthBypassEnabled } from "@/lib/dev-auth"

export interface CurrentUser {
  id: string
  churchId: string
  role: string
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession()
  if (!session?.user) return null

  return {
    id: session.user.id,
    churchId: session.user.churchId,
    role: session.user.role,
  }
}

export async function getCurrentUserOrDevFallback(): Promise<CurrentUser | null> {
  const user = await getCurrentUser()
  if (user) return user

  if (!isDevAuthBypassEnabled()) return null

  const fallbackUser = await db.user.findFirst({
    select: { id: true, churchId: true, role: true },
  })

  if (!fallbackUser) return null

  return fallbackUser
}
