import { NextRequest, NextResponse } from "next/server"
import type { Role } from "@/generated/prisma"
import { db } from "@/lib/db"
import { getCurrentUserOrDevFallback } from "@/lib/current-user"
import { hasPermission } from "@/lib/permissions"
import {
  addUserToTeamChannels,
  syncDefaultChannelMemberships,
} from "@/lib/channel-access"

const ALLOWED_ROLES = new Set<Role>([
  "ADMIN",
  "RESPONSABLE",
  "COLABORADOR",
  "INVITADO",
])

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserOrDevFallback()
    if (!currentUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const canManagePeople =
      currentUser.role === "ADMIN" ||
      (await hasPermission(currentUser.id, "people.manage"))
    if (!canManagePeople) {
      return NextResponse.json({ error: "Sin permisos para gestionar personas" }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, phone, role, teamId, tags } = body
    const requestedRole = typeof role === "string" ? role : "COLABORADOR"

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email son obligatorios" }, { status: 400 })
    }

    if (!ALLOWED_ROLES.has(requestedRole as Role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
    }

    const targetRole = requestedRole as Role

    if (targetRole === "ADMIN" && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo un administrador puede crear otro administrador" }, { status: 403 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 })
    }

    let validTeamId: string | null = null
    if (teamId) {
      const team = await db.team.findUnique({
        where: { id: String(teamId) },
        select: { id: true, churchId: true },
      })
      if (!team || team.churchId !== currentUser.churchId) {
        return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
      }
      validTeamId = team.id
    }

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone: phone || null,
        role: targetRole,
        churchId: currentUser.churchId,
        password: null, // No password — will login via Google or invite link
      },
    })

    // Add to team if provided
    if (validTeamId) {
      await db.teamMember.create({
        data: {
          teamId: validTeamId,
          userId: user.id,
          isLeader: false,
        },
      })
    }

    await syncDefaultChannelMemberships(user.id, currentUser.churchId)

    if (validTeamId) {
      await addUserToTeamChannels(user.id, validTeamId)
    }

    // Create tags if provided
    // tags = [{ tag: "Alabanza", sub: "Voz principal" }, ...]
    if (Array.isArray(tags) && tags.length > 0) {
      for (const { tag, sub } of tags) {
        if (typeof tag !== "string" || typeof sub !== "string") continue
        const tagName = `${tag} · ${sub}`
        // Find or create tag
        let tagRecord = await db.tag.findFirst({
          where: { name: tagName, churchId: currentUser.churchId },
        })
        if (!tagRecord) {
          tagRecord = await db.tag.create({
            data: {
              name: tagName,
              color: "#6B7280",
              churchId: currentUser.churchId,
            },
          })
        }
        await db.userTag.create({
          data: { userId: user.id, tagId: tagRecord.id },
        })
      }
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (err) {
    console.error("POST /api/people error:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
