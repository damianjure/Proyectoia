"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Hash,
  User,
  Megaphone,
  Send,
  Paperclip,
  Pin,
  Search,
  Loader2,
  PinOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRealtimeMessages, type RealtimeMessage } from "@/hooks/use-realtime-messages"
import { Can } from "@/components/shared/permission-gate"

interface Channel {
  id: string
  name: string
  type: "TEAM" | "GENERAL" | "DIRECT" | "BROADCAST"
  teamId: string | null
  messageCount: number
  memberCount: number
  lastMessage: string | null
  lastMessageAt: string | null
}

const CHANNEL_ICONS: Record<string, typeof Hash> = {
  TEAM: Hash,
  GENERAL: Hash,
  DIRECT: User,
  BROADCAST: Megaphone,
}

const CHANNEL_LABELS: Record<string, string> = {
  TEAM: "Canales",
  GENERAL: "Canales",
  DIRECT: "Mensajes directos",
  BROADCAST: "Avisos",
}

export default function MessagesPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelsLoading, setChannelsLoading] = useState(true)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [filter, setFilter] = useState<string>("all")
  const [channelSearch, setChannelSearch] = useState("")
  const [messageSearch, setMessageSearch] = useState("")

  // Fetch channels on mount
  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch("/api/channels")
        if (!res.ok) throw new Error("Error al cargar canales")
        const data = await res.json()
        setChannels(data.channels ?? [])
        // Auto-select first channel if none selected
        if (data.channels?.length > 0) {
          setSelectedChannelId(data.channels[0].id)
        }
      } catch (err) {
        console.error("Error loading channels:", err)
      } finally {
        setChannelsLoading(false)
      }
    }
    loadChannels()
  }, [])

  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    togglePin,
    error,
  } = useRealtimeMessages({
    channelId: selectedChannelId,
    enabled: !!selectedChannelId,
  })

  const selectedChannel = channels.find((c) => c.id === selectedChannelId)

  const filteredChannels = channels.filter((c) => {
    const matchesSearch = c.name
      .toLowerCase()
      .includes(channelSearch.toLowerCase())
    if (!matchesSearch) return false
    if (filter === "all") return true
    if (filter === "teams") return c.type === "TEAM" || c.type === "GENERAL"
    if (filter === "direct") return c.type === "DIRECT"
    if (filter === "broadcast") return c.type === "BROADCAST"
    return true
  })

  const visibleMessages = messages.filter((msg) =>
    msg.content.toLowerCase().includes(messageSearch.toLowerCase()) ||
    msg.sender.name.toLowerCase().includes(messageSearch.toLowerCase())
  )

  const groupedChannels = filteredChannels.reduce(
    (acc, channel) => {
      const group = CHANNEL_LABELS[channel.type] ?? "Otros"
      if (!acc[group]) acc[group] = []
      acc[group].push(channel)
      return acc
    },
    {} as Record<string, Channel[]>
  )

  const handleSend = async () => {
    if (!messageText.trim()) return
    const text = messageText
    setMessageText("")
    try {
      await sendMessage(text)
    } catch {
      // Error is already handled in the hook
      setMessageText(text)
    }
  }

  const pinnedMessages = messages.filter((m: RealtimeMessage) => m.isPinned)

  return (
    <Can
      permission="messages.send"
      fallback={
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          No tenés permisos para usar mensajes.
        </div>
      }
    >
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Mensajes</h1>

        <div className="grid h-[calc(100vh-220px)] gap-0 overflow-hidden rounded-lg border lg:grid-cols-[280px_1fr]">
        {/* Channel list */}
        <div className="border-r bg-card overflow-y-auto">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-8 h-8 text-sm"
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-1 px-3 pb-2">
            {["all", "teams", "direct", "broadcast"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-accent"
                )}
              >
                {f === "all" ? "Todos" : f === "teams" ? "Equipos" : f === "direct" ? "Directos" : "Avisos"}
              </button>
            ))}
          </div>

          {channelsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : channels.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No hay canales disponibles
            </div>
          ) : (
            Object.entries(groupedChannels).map(([group, chans]) => (
              <div key={group} className="py-1">
                <h3 className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">
                  {group}
                </h3>
                {chans.map((channel) => {
                  const Icon = CHANNEL_ICONS[channel.type] ?? Hash
                  return (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
                        selectedChannelId === channel.id && "bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate text-left">{channel.name}</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="flex flex-col bg-background">
          {selectedChannel && (
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = CHANNEL_ICONS[selectedChannel.type] ?? Hash
                  return <Icon className="h-4 w-4" />
                })()}
                <span className="font-medium">{selectedChannel.name}</span>
              </div>
            </div>
          )}

          {selectedChannel && (
            <div className="border-b px-4 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar en mensajes..."
                  className="pl-8 h-8 text-sm"
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                />
              </div>
            </div>
          )}

          {pinnedMessages.length > 0 && (
            <div className="border-b bg-amber-50 px-4 py-2 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-sm">
                <Pin className="h-3 w-3 text-amber-600" />
                <span className="text-amber-800 dark:text-amber-200 truncate">
                  {pinnedMessages[0].content}
                </span>
                <button
                  type="button"
                  className="ml-auto text-amber-700 hover:text-amber-900 dark:text-amber-200"
                  onClick={() => togglePin(pinnedMessages[0].id)}
                >
                  <PinOff className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                {selectedChannelId
                  ? messageSearch
                    ? "No se encontraron mensajes con ese filtro."
                    : "No hay mensajes aún. Envía el primero."
                  : "Selecciona un canal para ver mensajes."}
              </div>
            ) : (
              visibleMessages.map((msg: RealtimeMessage) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                    {msg.sender.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">{msg.sender.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {msg.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
                    </div>
                    <div className="mt-0.5 flex items-start justify-between gap-3">
                      <p className="text-sm">{msg.content}</p>
                      <button
                        type="button"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => togglePin(msg.id)}
                        title={msg.isPinned ? "Desfijar mensaje" : "Fijar mensaje"}
                      >
                        <Pin className={cn("h-3.5 w-3.5", msg.isPinned && "text-amber-500")} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t p-3">
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
              <button className="text-muted-foreground hover:text-foreground">
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <Button size="icon" variant="ghost" onClick={handleSend} disabled={!messageText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </Can>
  )
}
