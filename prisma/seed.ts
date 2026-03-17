import { config } from "dotenv"
config() // Load .env

import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hash } from "bcryptjs"

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error("DATABASE_URL no está definida en .env")
  console.log(`  📡 Conectando a: ${dbUrl.replace(/\/\/.*@/, "//***@")}`)
  const pool = new Pool({ connectionString: dbUrl })
  const adapter = new PrismaPg(
    pool as unknown as ConstructorParameters<typeof PrismaPg>[0]
  )
  const prisma = new PrismaClient({ adapter })

  console.log("🌱 Seeding database...")

  // Clean existing data
  await prisma.message.deleteMany()
  await prisma.channelMember.deleteMany()
  await prisma.channel.deleteMany()
  await prisma.songSubItem.deleteMany()
  await prisma.serviceItem.deleteMany()
  await prisma.serviceAssignment.deleteMany()
  await prisma.responsibleTask.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.service.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.userTag.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.permissionOverride.deleteMany()
  await prisma.permissionProfile.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.backup.deleteMany()
  await prisma.user.deleteMany()
  await prisma.church.deleteMany()

  // Create church
  const church = await prisma.church.create({
    data: {
      name: "Iglesia Ejemplo",
      address: "Av. Corrientes 1234, CABA",
      timezone: "America/Argentina/Buenos_Aires",
      language: "es",
      plan: "free",
    },
  })
  console.log(`  ✅ Iglesia: ${church.name}`)

  // Create users
  const passwordHash = await hash("password123", 12)

  const admin = await prisma.user.create({
    data: {
      churchId: church.id,
      name: "Pastor Daniel",
      email: "admin@iglesia.com",
      phone: "+54 11 5555-0001",
      role: "ADMIN",
      password: passwordHash,
    },
  })

  const responsable = await prisma.user.create({
    data: {
      churchId: church.id,
      name: "María López",
      email: "maria@iglesia.com",
      phone: "+54 11 5555-0002",
      role: "RESPONSABLE",
      password: passwordHash,
    },
  })

  const colaborador1 = await prisma.user.create({
    data: {
      churchId: church.id,
      name: "Juan Pérez",
      email: "juan@iglesia.com",
      phone: "+54 11 5555-0003",
      role: "COLABORADOR",
      password: passwordHash,
    },
  })

  const colaborador2 = await prisma.user.create({
    data: {
      churchId: church.id,
      name: "Ana García",
      email: "ana@iglesia.com",
      phone: "+54 11 5555-0004",
      role: "COLABORADOR",
      password: passwordHash,
    },
  })

  const colaborador3 = await prisma.user.create({
    data: {
      churchId: church.id,
      name: "Carlos Ruiz",
      email: "carlos@iglesia.com",
      phone: "+54 11 5555-0005",
      role: "COLABORADOR",
      password: passwordHash,
    },
  })

  const invitado = await prisma.user.create({
    data: {
      churchId: church.id,
      name: "Laura Martínez",
      email: "laura@iglesia.com",
      phone: "+54 11 5555-0006",
      role: "INVITADO",
      password: passwordHash,
    },
  })

  console.log(`  ✅ 6 usuarios creados`)

  // Create tags
  const tagAlabanza = await prisma.tag.create({
    data: { churchId: church.id, name: "Alabanza", color: "#8B5CF6" },
  })
  const tagSonido = await prisma.tag.create({
    data: { churchId: church.id, name: "Sonido", color: "#EF4444" },
  })
  const tagVisual = await prisma.tag.create({
    data: { churchId: church.id, name: "Visual", color: "#3B82F6" },
  })
  const tagPredica = await prisma.tag.create({
    data: { churchId: church.id, name: "Predicación", color: "#10B981" },
  })
  const tagBienvenida = await prisma.tag.create({
    data: { churchId: church.id, name: "Bienvenida", color: "#F59E0B" },
  })

  // Assign tags to users
  await prisma.userTag.createMany({
    data: [
      { userId: responsable.id, tagId: tagAlabanza.id },
      { userId: colaborador1.id, tagId: tagAlabanza.id },
      { userId: colaborador1.id, tagId: tagSonido.id },
      { userId: colaborador2.id, tagId: tagVisual.id },
      { userId: colaborador3.id, tagId: tagPredica.id },
      { userId: invitado.id, tagId: tagBienvenida.id },
    ],
  })
  console.log(`  ✅ 5 tags creados y asignados`)

  // Create teams
  const teamAlabanza = await prisma.team.create({
    data: {
      churchId: church.id,
      name: "Alabanza",
      color: "#8B5CF6",
      leaderId: responsable.id,
    },
  })

  const teamTecnica = await prisma.team.create({
    data: {
      churchId: church.id,
      name: "Técnica",
      color: "#EF4444",
      leaderId: colaborador1.id,
    },
  })

  const teamBienvenida = await prisma.team.create({
    data: {
      churchId: church.id,
      name: "Bienvenida",
      color: "#F59E0B",
      leaderId: colaborador2.id,
    },
  })

  // Add team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: teamAlabanza.id, userId: responsable.id, position: "Líder de alabanza", isLeader: true },
      { teamId: teamAlabanza.id, userId: colaborador1.id, position: "Guitarra" },
      { teamId: teamAlabanza.id, userId: colaborador3.id, position: "Voz" },
      { teamId: teamTecnica.id, userId: colaborador1.id, position: "Sonidista", isLeader: true },
      { teamId: teamTecnica.id, userId: colaborador2.id, position: "Proyector" },
      { teamId: teamBienvenida.id, userId: colaborador2.id, position: "Coordinadora", isLeader: true },
      { teamId: teamBienvenida.id, userId: invitado.id, position: "Recepción" },
    ],
  })
  console.log(`  ✅ 3 equipos creados con miembros`)

  // Create services
  const nextSunday = new Date()
  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()))
  nextSunday.setHours(10, 0, 0, 0)

  const lastSunday = new Date()
  lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay())
  lastSunday.setHours(10, 0, 0, 0)

  const serviceNext = await prisma.service.create({
    data: {
      churchId: church.id,
      date: nextSunday,
      time: "10:00",
      type: "REGULAR",
      status: "DRAFT",
      notes: "Servicio dominical regular",
    },
  })

  await prisma.service.create({
    data: {
      churchId: church.id,
      date: lastSunday,
      time: "10:00",
      type: "REGULAR",
      status: "COMPLETED",
      notes: "Servicio completado",
    },
  })

  // Create service items (flow) for next service
  await prisma.serviceItem.create({
    data: {
      serviceId: serviceNext.id,
      order: 1,
      title: "Bienvenida",
      duration: 5,
      type: "anuncios",
      color: "#F59E0B",
    },
  })

  const item2 = await prisma.serviceItem.create({
    data: {
      serviceId: serviceNext.id,
      order: 2,
      title: "Bloque de alabanza",
      duration: 25,
      type: "alabanza",
      color: "#8B5CF6",
    },
  })

  await prisma.serviceItem.create({
    data: {
      serviceId: serviceNext.id,
      order: 3,
      title: "Predicación",
      duration: 35,
      type: "predicacion",
      color: "#10B981",
    },
  })

  await prisma.serviceItem.create({
    data: {
      serviceId: serviceNext.id,
      order: 4,
      title: "Oración final",
      duration: 10,
      type: "oracion",
      color: "#3B82F6",
    },
  })

  // Add songs to alabanza block
  await prisma.songSubItem.createMany({
    data: [
      { serviceItemId: item2.id, order: 1, songName: "Grande es tu fidelidad", artist: "Himno clásico", key: "D" },
      { serviceItemId: item2.id, order: 2, songName: "Aquí estoy", artist: "Jesús Adrián Romero", key: "G" },
      { serviceItemId: item2.id, order: 3, songName: "Reckless Love", artist: "Cory Asbury", key: "C" },
    ],
  })

  console.log(`  ✅ 2 servicios creados con flujo e ítems`)

  // Create assignments
  await prisma.serviceAssignment.createMany({
    data: [
      { serviceId: serviceNext.id, teamId: teamAlabanza.id, userId: responsable.id, position: "Líder", status: "CONFIRMED" },
      { serviceId: serviceNext.id, teamId: teamAlabanza.id, userId: colaborador1.id, position: "Guitarra", status: "CONFIRMED" },
      { serviceId: serviceNext.id, teamId: teamTecnica.id, userId: colaborador2.id, position: "Proyector", status: "PENDING" },
      { serviceId: serviceNext.id, teamId: teamBienvenida.id, userId: invitado.id, position: "Recepción", status: "PENDING" },
    ],
  })

  // Create responsible tasks
  await prisma.responsibleTask.createMany({
    data: [
      { serviceId: serviceNext.id, teamId: teamAlabanza.id, responsibleId: responsable.id, status: "IN_PROGRESS" },
      { serviceId: serviceNext.id, teamId: teamTecnica.id, responsibleId: colaborador1.id, status: "PENDING" },
    ],
  })

  console.log(`  ✅ Asignaciones y tareas creadas`)

  // Create channels
  const chGeneral = await prisma.channel.create({
    data: { churchId: church.id, name: "General", type: "GENERAL" },
  })
  const chAnuncios = await prisma.channel.create({
    data: { churchId: church.id, name: "Anuncios", type: "BROADCAST" },
  })
  const chAlabanza = await prisma.channel.create({
    data: { churchId: church.id, name: "Alabanza", type: "TEAM", teamId: teamAlabanza.id },
  })
  const chTecnica = await prisma.channel.create({
    data: { churchId: church.id, name: "Técnica", type: "TEAM", teamId: teamTecnica.id },
  })

  // Add members to channels
  const allUsers = [admin, responsable, colaborador1, colaborador2, colaborador3, invitado]
  await prisma.channelMember.createMany({
    data: [
      ...allUsers.map((u) => ({ channelId: chGeneral.id, userId: u.id })),
      ...allUsers.map((u) => ({ channelId: chAnuncios.id, userId: u.id })),
      { channelId: chAlabanza.id, userId: responsable.id },
      { channelId: chAlabanza.id, userId: colaborador1.id },
      { channelId: chAlabanza.id, userId: colaborador3.id },
      { channelId: chTecnica.id, userId: colaborador1.id },
      { channelId: chTecnica.id, userId: colaborador2.id },
    ],
  })

  // Add some messages
  await prisma.message.createMany({
    data: [
      { channelId: chGeneral.id, senderId: admin.id, content: "¡Bienvenidos al chat de la iglesia! 🙏" },
      { channelId: chGeneral.id, senderId: responsable.id, content: "¡Hola a todos! Qué alegría estar conectados aquí." },
      { channelId: chGeneral.id, senderId: colaborador1.id, content: "Buenas! Listo para el domingo 💪" },
      { channelId: chAlabanza.id, senderId: responsable.id, content: "Ensayo este viernes a las 19hs, ¿pueden todos?" },
      { channelId: chAlabanza.id, senderId: colaborador1.id, content: "Ahí estaré 🎸" },
      { channelId: chAlabanza.id, senderId: responsable.id, content: "Las canciones para el domingo ya están en el servicio", isPinned: true },
      { channelId: chAnuncios.id, senderId: admin.id, content: "📢 Retiro de jóvenes el próximo mes. Inscripciones abiertas." },
      { channelId: chTecnica.id, senderId: colaborador1.id, content: "Revisé el sistema de sonido, todo OK para el domingo." },
    ],
  })
  console.log(`  ✅ 4 canales con mensajes creados`)

  // Create calendar events
  await prisma.calendarEvent.createMany({
    data: [
      {
        churchId: church.id,
        serviceId: serviceNext.id,
        title: "Servicio Dominical",
        date: nextSunday,
        time: "10:00",
        type: "SERVICE",
      },
      {
        churchId: church.id,
        title: "Ensayo de Alabanza",
        date: new Date(nextSunday.getTime() - 2 * 24 * 60 * 60 * 1000), // Friday
        time: "19:00",
        type: "REHEARSAL",
      },
      {
        churchId: church.id,
        title: "Reunión de líderes",
        date: new Date(nextSunday.getTime() + 2 * 24 * 60 * 60 * 1000), // Tuesday
        time: "20:00",
        type: "SPECIAL",
      },
    ],
  })
  console.log(`  ✅ 3 eventos de calendario creados`)

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      { churchId: church.id, userId: admin.id, action: "create", section: "services", detail: "Creó el servicio del próximo domingo" },
      { churchId: church.id, userId: responsable.id, action: "update", section: "services", detail: "Actualizó el flujo del servicio" },
      { churchId: church.id, userId: admin.id, action: "create", section: "teams", detail: "Creó el equipo de Alabanza" },
      { churchId: church.id, userId: colaborador1.id, action: "confirm", section: "assignments", detail: "Confirmó asignación para el domingo" },
    ],
  })

  // Create notifications
  await prisma.notification.createMany({
    data: [
      { userId: colaborador2.id, type: "assignment", content: "Fuiste asignado al servicio del domingo como Proyector", actionUrl: `/services/${serviceNext.id}` },
      { userId: invitado.id, type: "assignment", content: "Fuiste asignado al servicio del domingo como Recepción", actionUrl: `/services/${serviceNext.id}` },
      { userId: responsable.id, type: "message", content: "Nuevo mensaje en #General", actionUrl: "/messages" },
    ],
  })
  console.log(`  ✅ Logs y notificaciones creadas`)

  // Create a backup record
  await prisma.backup.create({
    data: {
      churchId: church.id,
      triggerType: "LOGIN_ADMIN",
      triggeredBy: admin.id,
      sizeBytes: 1024 * 50, // 50KB
      storageUrl: "/backups/backup-seed.zip",
    },
  })
  console.log(`  ✅ Backup de ejemplo creado`)

  console.log("\n🎉 Seed completado exitosamente!")
  console.log("\n📋 Credenciales de acceso:")
  console.log("  Admin:       admin@iglesia.com / password123")
  console.log("  Responsable: maria@iglesia.com / password123")
  console.log("  Colaborador: juan@iglesia.com  / password123")
  console.log("  Invitado:    laura@iglesia.com / password123")

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error("❌ Error en seed:", e)
  process.exit(1)
})
