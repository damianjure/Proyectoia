"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Church, Users, UserPlus, Music, Check } from "lucide-react"

const STEPS = [
  { title: "Tu iglesia", description: "Datos básicos de tu iglesia", icon: Church },
  { title: "Equipos", description: "Creá los equipos de trabajo", icon: Users },
  { title: "Personas", description: "Agregá miembros", icon: UserPlus },
  { title: "Primer servicio", description: "Configurá tu primer servicio", icon: Music },
]

const DEFAULT_TEAMS = [
  { name: "Alabanza", color: "#8B5CF6" },
  { name: "Sonido", color: "#3B82F6" },
  { name: "Streaming", color: "#EF4444" },
  { name: "Bienvenida/Anuncios", color: "#F59E0B" },
  { name: "Multimedia", color: "#10B981" },
  { name: "Predicación", color: "#6366F1" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  // Step 1: Church data
  const [churchName, setChurchName] = useState("")
  const [churchAddress, setChurchAddress] = useState("")
  const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires")

  // Step 2: Teams
  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    DEFAULT_TEAMS.map((t) => t.name)
  )
  const [customTeam, setCustomTeam] = useState("")

  // Step 3: People
  const [people, setPeople] = useState<{ name: string; email: string }[]>([
    { name: "", email: "" },
  ])

  // Step 4: First service
  const [serviceDate, setServiceDate] = useState("")
  const [serviceTime, setServiceTime] = useState("10:00")

  const toggleTeam = (name: string) => {
    setSelectedTeams((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )
  }

  const addCustomTeam = () => {
    if (customTeam.trim() && !selectedTeams.includes(customTeam.trim())) {
      setSelectedTeams((prev) => [...prev, customTeam.trim()])
      setCustomTeam("")
    }
  }

  const addPerson = () => {
    setPeople((prev) => [...prev, { name: "", email: "" }])
  }

  const updatePerson = (
    index: number,
    field: "name" | "email",
    value: string
  ) => {
    setPeople((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  const handleFinish = async () => {
    // TODO: API call to save onboarding data
    router.push("/")
  }

  const canNext = () => {
    switch (currentStep) {
      case 0:
        return churchName.trim().length > 0
      case 1:
        return selectedTeams.length > 0
      case 2:
        return true // people are optional
      case 3:
        return serviceDate.length > 0
      default:
        return false
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                  i < currentStep
                    ? "bg-primary text-primary-foreground"
                    : i === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-12 sm:w-20 ${
                    i < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Paso {currentStep + 1} de {STEPS.length}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Church Data */}
          {currentStep === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="churchName">Nombre de la iglesia *</Label>
                <Input
                  id="churchName"
                  placeholder="Ej: Iglesia Bautista Central"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="churchAddress">Dirección (opcional)</Label>
                <Input
                  id="churchAddress"
                  placeholder="Ej: Av. Rivadavia 1234, CABA"
                  value={churchAddress}
                  onChange={(e) => setChurchAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona horaria</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 2: Teams */}
          {currentStep === 1 && (
            <>
              <p className="text-sm text-muted-foreground">
                Seleccioná los equipos que usa tu iglesia. Podés agregar más
                después.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_TEAMS.map((team) => (
                  <button
                    key={team.name}
                    onClick={() => toggleTeam(team.name)}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                      selectedTeams.includes(team.name)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    {team.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar equipo personalizado..."
                  value={customTeam}
                  onChange={(e) => setCustomTeam(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomTeam()}
                />
                <Button variant="outline" onClick={addCustomTeam}>
                  Agregar
                </Button>
              </div>
              {selectedTeams
                .filter((t) => !DEFAULT_TEAMS.some((d) => d.name === t))
                .map((team) => (
                  <div
                    key={team}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm">{team}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTeam(team)}
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
            </>
          )}

          {/* Step 3: People */}
          {currentStep === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                Agregá personas manualmente o importá un archivo Excel después.
              </p>
              {people.map((person, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Nombre"
                    value={person.name}
                    onChange={(e) => updatePerson(i, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={person.email}
                    onChange={(e) => updatePerson(i, "email", e.target.value)}
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addPerson} className="w-full">
                + Agregar otra persona
              </Button>
              <p className="text-xs text-muted-foreground">
                Podés saltar este paso e importar personas después desde un
                archivo .xlsx
              </p>
            </>
          )}

          {/* Step 4: First Service */}
          {currentStep === 3 && (
            <>
              <p className="text-sm text-muted-foreground">
                Configurá tu próximo servicio. Se creará con un flujo básico que
                podés editar después.
              </p>
              <div className="space-y-2">
                <Label htmlFor="serviceDate">Fecha del servicio *</Label>
                <Input
                  id="serviceDate"
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceTime">Hora</Label>
                <Input
                  id="serviceTime"
                  type="time"
                  value={serviceTime}
                  onChange={(e) => setServiceTime(e.target.value)}
                />
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">
                  Flujo básico pre-cargado:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>1. Bienvenida (5 min)</li>
                  <li>2. Alabanza (20 min)</li>
                  <li>3. Anuncios (5 min)</li>
                  <li>4. Predicación (30 min)</li>
                  <li>5. Oración final (10 min)</li>
                  <li>6. Despedida (5 min)</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 0}
          >
            Anterior
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canNext()}
            >
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={!canNext()}>
              Finalizar
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
