"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { PERMISSIONS, type PermissionKey } from "@/types/permissions"
import { ROLE_PERMISSIONS } from "@/lib/role-permissions"
import { Shield, Users, Search, RotateCcw } from "lucide-react"
import type { UserWithOverrides } from "@/lib/actions/admin"
import { updateUserRole, updatePermissionOverrides } from "@/lib/actions/admin"
import type { Role } from "@/generated/prisma"
import { useRouter } from "next/navigation"

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  RESPONSABLE: "bg-blue-100 text-blue-800",
  COLABORADOR: "bg-green-100 text-green-800",
  INVITADO: "bg-gray-100 text-gray-800",
}

const PERMISSION_GROUPS: Record<string, PermissionKey[]> = {
  Servicios: ["services.view", "services.edit", "services.publish", "services.delete"],
  Equipos: ["teams.view", "teams.manage", "teams.add_members"],
  Calendario: ["calendar.view", "calendar.edit"],
  Mensajes: ["messages.send", "messages.broadcast"],
  Personas: ["people.view", "people.manage", "people.export"],
  Reportes: ["reports.view", "reports.export"],
  Admin: ["admin.roles", "admin.settings", "admin.activity_log", "admin.backups"],
}

interface RolesClientProps {
  users: UserWithOverrides[]
}

export default function RolesClient({ users }: RolesClientProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const roleCounts = {
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    RESPONSABLE: users.filter((u) => u.role === "RESPONSABLE").length,
    COLABORADOR: users.filter((u) => u.role === "COLABORADOR").length,
    INVITADO: users.filter((u) => u.role === "INVITADO").length,
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPermissionValue = (key: PermissionKey): boolean => {
    if (key in overrides) return overrides[key]
    if (!selectedUser) return false
    // Check user-level overrides from DB
    const dbOverride = selectedUser.overrides.find((o) => o.permissionKey === key)
    if (dbOverride) return dbOverride.value
    return ROLE_PERMISSIONS[selectedUser.role]?.[key] ?? false
  }

  const isOverridden = (key: PermissionKey): boolean => {
    if (key in overrides) return true
    if (!selectedUser) return false
    return selectedUser.overrides.some((o) => o.permissionKey === key)
  }

  const togglePermission = (key: PermissionKey) => {
    const currentValue = getPermissionValue(key)
    setOverrides((prev) => ({ ...prev, [key]: !currentValue }))
  }

  const resetOverrides = () => setOverrides({})

  const handleRoleChange = (newRole: string) => {
    if (!selectedUser) return
    startTransition(async () => {
      await updateUserRole(selectedUser.id, newRole as Role)
      router.refresh()
    })
  }

  const handleSaveOverrides = () => {
    if (!selectedUser) return
    // Merge DB overrides with local changes
    const merged: Record<string, boolean> = {}
    for (const o of selectedUser.overrides) {
      merged[o.permissionKey] = o.value
    }
    for (const [key, value] of Object.entries(overrides)) {
      merged[key] = value
    }
    const overrideList = Object.entries(merged).map(([permissionKey, value]) => ({
      permissionKey,
      value,
    }))
    startTransition(async () => {
      await updatePermissionOverrides(selectedUser.id, overrideList)
      setOverrides({})
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles y permisos</h1>
      </div>

      {/* Role summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(roleCounts).map(([role, count]) => (
          <Card key={role}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <Badge className={ROLE_COLORS[role]}>{role}</Badge>
                <p className="mt-1 text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">personas</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground/30" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[350px_1fr]">
        {/* User list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar persona..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No se encontraron personas
              </p>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUserId(user.id)
                    setOverrides({})
                  }}
                  className={`w-full flex items-center justify-between rounded-lg p-3 text-left text-sm transition-colors ${
                    selectedUserId === user.id ? "bg-primary/10" : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={ROLE_COLORS[user.role]}>
                      {user.role}
                    </Badge>
                    {user.hasOverrides && (
                      <div className="h-2 w-2 rounded-full bg-amber-500" title="Tiene permisos personalizados" />
                    )}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Permission editor */}
        <Card>
          {selectedUser ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedUser.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Rol base: <Badge className={ROLE_COLORS[selectedUser.role]}>{selectedUser.role}</Badge>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetOverrides} disabled={isPending}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Resetear a rol base
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <Label>Cambiar rol base</Label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    defaultValue={selectedUser.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={isPending}
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="RESPONSABLE">Responsable</option>
                    <option value="COLABORADOR">Colaborador</option>
                    <option value="INVITADO">Invitado</option>
                  </select>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-4">Permisos granulares</h3>
                  {Object.entries(PERMISSION_GROUPS).map(([group, keys]) => (
                    <div key={group} className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">{group}</h4>
                      <div className="space-y-2">
                        {keys.map((key) => (
                          <div key={key} className="flex items-center justify-between rounded-lg border p-2">
                            <div className="flex items-center gap-2">
                              {isOverridden(key) && (
                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                              )}
                              <Label htmlFor={key} className="text-sm cursor-pointer">
                                {PERMISSIONS[key]}
                              </Label>
                            </div>
                            <Switch
                              id={key}
                              checked={getPermissionValue(key)}
                              onCheckedChange={() => togglePermission(key)}
                              disabled={isPending}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {Object.keys(overrides).length > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={resetOverrides} disabled={isPending}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveOverrides} disabled={isPending}>
                        {isPending ? "Guardando..." : "Guardar cambios"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center py-20">
              <div className="text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Selecciona una persona para editar sus permisos</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
