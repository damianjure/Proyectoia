"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Plus,
  Search,
  UserPlus,
  Mail,
  Phone,
  Filter,
  Download,
} from "lucide-react"
import { AddPersonDialog } from "@/components/shared/add-person-dialog"

interface TeamData {
  id: string
  name: string
  color: string
  leaderName: string | null
  memberCount: number
  members: {
    id: string
    position: string | null
    isLeader: boolean
    user: {
      id: string
      name: string
      email: string
      avatar: string | null
    }
  }[]
}

interface PersonData {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  avatar: string | null
  teams: { id: string; name: string; color: string }[]
  tags: { id: string; name: string; color: string }[]
}

interface TeamsClientProps {
  teams: TeamData[]
  directory: PersonData[]
  canViewTeams: boolean
  canViewDirectory: boolean
}

export default function TeamsClient({
  teams,
  directory,
  canViewTeams,
  canViewDirectory,
}: TeamsClientProps) {
  const router = useRouter()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [searchPeople, setSearchPeople]     = useState("")
  const [addPersonOpen, setAddPersonOpen]   = useState(false)
  const defaultTab = canViewTeams ? "teams" : "directory"

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const filteredPeople = directory.filter(
    (p) =>
      p.name.toLowerCase().includes(searchPeople.toLowerCase()) ||
      p.email.toLowerCase().includes(searchPeople.toLowerCase())
  )

  const teamList = teams.map((t) => ({ id: t.id, name: t.name, color: t.color }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Equipos</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo equipo
        </Button>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {canViewTeams ? <TabsTrigger value="teams">Equipos</TabsTrigger> : null}
          {canViewDirectory ? (
            <TabsTrigger value="directory">Directorio de personas</TabsTrigger>
          ) : null}
        </TabsList>

        {/* Teams Tab */}
        {canViewTeams ? (
          <TabsContent value="teams" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 col-span-full text-center">
                No hay equipos creados todavía.
              </p>
            ) : (
              teams.map((team) => (
                <Card
                  key={team.id}
                  className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedTeamId === team.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() =>
                    setSelectedTeamId(selectedTeamId === team.id ? null : team.id)
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <CardTitle className="text-base">{team.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>Líder: {team.leaderName ?? "Sin asignar"}</p>
                      <p>{team.memberCount} miembros</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {selectedTeam && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: selectedTeam.color }}
                    />
                    <CardTitle>{selectedTeam.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-1" />
                      Mensaje grupal
                    </Button>
                    <Button size="sm" onClick={() => setAddPersonOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Agregar miembro
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="members">
                  <TabsList>
                    <TabsTrigger value="members">Miembros</TabsTrigger>
                    <TabsTrigger value="next">Próximo servicio</TabsTrigger>
                    <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
                  </TabsList>
                  <TabsContent value="members" className="space-y-2 pt-4">
                    {selectedTeam.members.length > 0 ? (
                      selectedTeam.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                              {member.user.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{member.user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.position ?? (member.isLeader ? "Líder" : "Miembro")}
                              </p>
                            </div>
                          </div>
                          {member.isLeader && <Badge variant="outline">Líder</Badge>}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No hay miembros en este equipo todavía.
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="next" className="py-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Información del próximo servicio para este equipo.
                    </p>
                  </TabsContent>
                  <TabsContent value="availability" className="py-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Grilla de disponibilidad multi-semana.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
          </TabsContent>
        ) : null}

        {/* Directory Tab */}
        {canViewDirectory ? (
          <TabsContent value="directory" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchPeople}
                onChange={(e) => setSearchPeople(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-1" />
              Filtros
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
            <Button onClick={() => setAddPersonOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1" />
              Agregar persona
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Nombre</th>
                      <th className="px-4 py-3 text-left font-medium">Equipo(s)</th>
                      <th className="px-4 py-3 text-left font-medium">Etiquetas</th>
                      <th className="px-4 py-3 text-left font-medium">Rol</th>
                      <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPeople.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No se encontraron personas.{" "}
                          <button
                            className="text-primary underline"
                            onClick={() => setAddPersonOpen(true)}
                          >
                            Agregar una
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredPeople.map((person) => (
                        <tr key={person.id} className="border-b hover:bg-accent/50 cursor-pointer">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                                {person.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-medium">{person.name}</p>
                                <p className="text-xs text-muted-foreground">{person.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {person.teams.map((t) => t.name).join(", ") || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {person.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs text-white"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{person.role}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {person.phone ?? "-"}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          </TabsContent>
        ) : null}
      </Tabs>

      <AddPersonDialog
        open={addPersonOpen}
        onOpenChange={setAddPersonOpen}
        teams={teamList}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
