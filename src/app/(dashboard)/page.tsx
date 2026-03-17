import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CheckCircle, AlertCircle, Users } from "lucide-react"

const stats = [
  {
    title: "Próximo servicio",
    value: "Domingo 23/03",
    icon: Calendar,
  },
  {
    title: "Confirmados",
    value: "12/18",
    icon: CheckCircle,
  },
  {
    title: "Pendientes",
    value: "4",
    icon: AlertCircle,
  },
  {
    title: "Equipos cubiertos",
    value: "4/6",
    icon: Users,
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">¡Bienvenido!</h1>
        <p className="text-muted-foreground">
          Resumen de tu iglesia
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Flujo del servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay servicios próximos configurados.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay actividad reciente.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
