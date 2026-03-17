"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export interface RealtimeMessage {
  id: string
  channelId: string
  senderId: string
  content: string
  type: "TEXT" | "SYSTEM" | "FILE"
  isPinned: boolean
  createdAt: string
  sender: {
    id: string
    name: string
    avatar: string | null
  }
}

interface UseRealtimeMessagesOptions {
  channelId: string | null
  enabled?: boolean
  pollingInterval?: number // ms, default 3000
}

export function useRealtimeMessages({
  channelId,
  enabled = true,
  pollingInterval = 3000,
}: UseRealtimeMessagesOptions) {
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!channelId) return

    try {
      const res = await fetch(`/api/messages?channelId=${channelId}`)
      if (!res.ok) throw new Error("Error al cargar mensajes")
      const data = await res.json()
      setMessages(data.messages)
      setError(null)

      // Track latest message for notifications
      if (data.messages.length > 0) {
        const latestId = data.messages[data.messages.length - 1].id
        if (lastMessageIdRef.current && latestId !== lastMessageIdRef.current) {
          // New message arrived — could trigger notification here
        }
        lastMessageIdRef.current = latestId
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    }
  }, [channelId])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channelId || !content.trim()) return

      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId, content: content.trim() }),
        })

        if (!res.ok) throw new Error("Error al enviar mensaje")

        const data = await res.json()
        // Optimistic update
        setMessages((prev) => [...prev, data.message])
        return data.message
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al enviar")
        throw err
      }
    },
    [channelId]
  )

  const togglePin = useCallback(async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/pin`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error("Error al fijar mensaje")

      const data = await res.json()
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isPinned: data.isPinned } : m))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    if (!channelId || !enabled) {
      setMessages([])
      return
    }

    setIsLoading(true)
    fetchMessages().finally(() => setIsLoading(false))
  }, [channelId, enabled, fetchMessages])

  // Polling
  useEffect(() => {
    if (!channelId || !enabled) return

    intervalRef.current = setInterval(fetchMessages, pollingInterval)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [channelId, enabled, pollingInterval, fetchMessages])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    togglePin,
    refresh: fetchMessages,
  }
}
