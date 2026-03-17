import { hasPermission } from "@/lib/permissions"
import { getAuthUser } from "@/lib/actions/helpers"
import TeamsClient from "./teams-client"
import { getDirectory, getTeamById, getTeams } from "@/lib/actions/teams"

export default async function TeamsPage() {
  const user = await getAuthUser()
  const canViewTeams = await hasPermission(user.id, "teams.view")
  const canViewPeople = await hasPermission(user.id, "people.view")

  if (!canViewTeams && !canViewPeople) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No tenés permisos para ver equipos o personas.</p>
      </div>
    )
  }

  const [teamSummaries, directory] = await Promise.all([
    canViewTeams ? getTeams(user.churchId) : Promise.resolve([]),
    canViewPeople ? getDirectory(user.churchId) : Promise.resolve([]),
  ])

  const teams = canViewTeams
    ? (
        await Promise.all(
          teamSummaries.map(async (team) => {
            const detail = await getTeamById(team.id)

            if (!detail) {
              return null
            }

            return {
              id: team.id,
              name: team.name,
              color: team.color,
              leaderName: team.leaderName,
              memberCount: team.memberCount,
              members: detail.members,
            }
          })
        )
      ).filter((team) => team !== null)
    : []

  return (
    <TeamsClient
      teams={teams}
      directory={directory}
      canViewTeams={canViewTeams}
      canViewDirectory={canViewPeople}
    />
  )
}
