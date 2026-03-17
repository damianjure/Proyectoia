"use client"

import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Can } from "@/components/shared/permission-gate"
import { useIsClient } from "@/hooks/use-is-client"
import {
  Church,
  Bell,
  Plug,
  Palette,
  CreditCard,
} from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useIsClient()

  return (
    <Can
      permission="admin.settings"
      fallback={
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          No tenés permisos para ver configuración.
        </div>
      }
    >
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Configuración</h1>

        <div className="space-y-6">
        {/* Church data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Church className="h-4 w-4" />
              Datos de la iglesia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre de la iglesia</Label>
                <Input defaultValue="Iglesia Demo" />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input defaultValue="Av. Rivadavia 1234, CABA" />
              </div>
              <div className="space-y-2">
                <Label>Zona horaria</Label>
                <Input defaultValue="America/Argentina/Buenos_Aires" />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <select className="w-full rounded-md border px-3 py-2 text-sm bg-background">
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>
            </div>
            <Button>Guardar cambios</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Recordatorio 48h antes", desc: "Enviar recordatorio 2 días antes del servicio", defaultChecked: true },
              { label: "Recordatorio 2h antes",  desc: "Recordatorio de último momento",               defaultChecked: true },
              { label: "Alertas de rechazos",    desc: "Notificar cuando alguien rechaza participación", defaultChecked: true },
              { label: "Resumen semanal",        desc: "Email con resumen de la semana",               defaultChecked: false },
            ].map((item, i) => (
              <div key={item.label}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.defaultChecked} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Integraciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Google Calendar",   status: "Desconectado", connected: false },
              { name: "Spotify",           status: "Desconectado", connected: false },
              { name: "CCLI SongSelect",   status: "Desconectado", connected: false },
              { name: "WhatsApp Business", status: "Desconectado", connected: false },
            ].map((integration) => (
              <div key={integration.name} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{integration.name}</p>
                  <p className="text-xs text-muted-foreground">{integration.status}</p>
                </div>
                <Button variant="outline" size="sm">
                  Conectar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Apariencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Tema oscuro</Label>
                <p className="text-xs text-muted-foreground">
                  {mounted ? `Tema actual: ${resolvedTheme === "dark" ? "Oscuro" : "Claro"}` : "Cargando..."}
                </p>
              </div>
              <Switch
                checked={mounted ? resolvedTheme === "dark" : false}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                disabled={!mounted}
              />
            </div>
            {mounted && (
              <div className="flex gap-2">
                {(["light", "dark", "system"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={theme === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(t)}
                    className="capitalize"
                  >
                    {t === "light" ? "Claro" : t === "dark" ? "Oscuro" : "Sistema"}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plan y facturación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Plan Gratuito</p>
                  <p className="text-sm text-muted-foreground">Hasta 75 miembros</p>
                </div>
                <Button>Upgrade</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </Can>
  )
}
