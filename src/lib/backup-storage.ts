import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const LOCAL_STORAGE_PREFIX = "local:"
const SUPABASE_STORAGE_PREFIX = "supabase:"
const PRIVATE_BACKUP_DIR = path.join(process.cwd(), "var", "backups")
const LEGACY_PUBLIC_BACKUP_DIR = path.join(process.cwd(), "public", "backups")
const DEFAULT_SUPABASE_BUCKET = "backups"

type StorageMode = "local" | "supabase"

interface SupabaseConfig {
  url: string
  serviceRoleKey: string
  bucket: string
}

function getStorageMode(): StorageMode {
  const explicitMode = process.env.BACKUP_STORAGE?.trim().toLowerCase()
  if (explicitMode === "local" || explicitMode === "supabase") {
    return explicitMode
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "supabase"
  }

  return "local"
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const bucket =
    process.env.SUPABASE_BACKUP_BUCKET?.trim() || DEFAULT_SUPABASE_BUCKET

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para guardar backups en Supabase Storage."
    )
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
    bucket,
  }
}

function getSupabaseObjectPath(fileName: string, churchId: string) {
  return `${churchId}/${fileName}`
}

function ensureLocalStorageAvailable() {
  if (process.env.VERCEL === "1") {
    throw new Error(
      "BACKUP_STORAGE=local no es persistente en Vercel. Configura Supabase Storage para backups."
    )
  }
}

async function fetchSupabaseStorage(
  input: string,
  init: RequestInit = {}
) {
  const { url, serviceRoleKey } = getSupabaseConfig()
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${serviceRoleKey}`)
  headers.set("apikey", serviceRoleKey)

  return fetch(`${url}${input}`, {
    ...init,
    headers,
  })
}

export function getBackupDownloadName(storageUrl: string | null, backupId: string) {
  if (!storageUrl) return `${backupId}.json`
  if (storageUrl.startsWith(SUPABASE_STORAGE_PREFIX)) {
    return path.basename(storageUrl.slice(SUPABASE_STORAGE_PREFIX.length))
  }
  if (storageUrl.startsWith(LOCAL_STORAGE_PREFIX)) {
    return path.basename(storageUrl.slice(LOCAL_STORAGE_PREFIX.length))
  }
  return path.basename(storageUrl)
}

export async function storeBackupFile(input: {
  churchId: string
  fileName: string
  content: string
}) {
  const mode = getStorageMode()

  if (mode === "supabase") {
    const { bucket } = getSupabaseConfig()
    const objectPath = getSupabaseObjectPath(input.fileName, input.churchId)
    const response = await fetchSupabaseStorage(
      `/storage/v1/object/${bucket}/${objectPath}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "x-upsert": "true",
        },
        body: input.content,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`No se pudo subir el backup a Supabase Storage: ${errorText}`)
    }

    return `${SUPABASE_STORAGE_PREFIX}${objectPath}`
  }

  ensureLocalStorageAvailable()
  await mkdir(PRIVATE_BACKUP_DIR, { recursive: true })
  await writeFile(path.join(PRIVATE_BACKUP_DIR, input.fileName), input.content, "utf8")
  return `${LOCAL_STORAGE_PREFIX}${input.fileName}`
}

export async function deleteBackupFile(storageUrl: string | null) {
  if (!storageUrl) return

  if (storageUrl.startsWith(SUPABASE_STORAGE_PREFIX)) {
    const { bucket } = getSupabaseConfig()
    const objectPath = storageUrl.slice(SUPABASE_STORAGE_PREFIX.length)
    const response = await fetchSupabaseStorage("/storage/v1/object/" + bucket, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: [objectPath] }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`No se pudo borrar el backup de Supabase Storage: ${errorText}`)
    }
    return
  }

  const filePath = getLocalBackupFilePath(storageUrl)
  if (!filePath) return
  await rm(filePath, { force: true })
}

function getLocalBackupFilePath(storageUrl: string) {
  if (storageUrl.startsWith(LOCAL_STORAGE_PREFIX)) {
    return path.join(
      PRIVATE_BACKUP_DIR,
      path.basename(storageUrl.slice(LOCAL_STORAGE_PREFIX.length))
    )
  }

  if (storageUrl.startsWith("/backups/")) {
    return path.join(LEGACY_PUBLIC_BACKUP_DIR, path.basename(storageUrl))
  }

  if (!storageUrl.includes(":")) {
    return path.join(PRIVATE_BACKUP_DIR, path.basename(storageUrl))
  }

  return null
}

export async function readBackupFile(storageUrl: string | null) {
  if (!storageUrl) {
    throw new Error("Backup sin archivo asociado")
  }

  if (storageUrl.startsWith(SUPABASE_STORAGE_PREFIX)) {
    const { bucket } = getSupabaseConfig()
    const objectPath = storageUrl.slice(SUPABASE_STORAGE_PREFIX.length)
    const encodedObjectPath = objectPath
      .split("/")
      .map(encodeURIComponent)
      .join("/")
    const response = await fetchSupabaseStorage(
      `/storage/v1/object/authenticated/${bucket}/${encodedObjectPath}`,
      {
        method: "GET",
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`No se pudo descargar el backup de Supabase Storage: ${errorText}`)
    }

    return Buffer.from(await response.arrayBuffer())
  }

  const filePath = getLocalBackupFilePath(storageUrl)
  if (!filePath) {
    throw new Error("Backup sin ubicación de almacenamiento válida")
  }

  return readFile(filePath)
}
