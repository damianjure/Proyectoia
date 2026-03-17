const DEFAULT_WINDOW_MS = 10 * 60 * 1000

interface RateLimitBucket {
  count: number
  resetAt: number
}

const globalForRateLimit = globalThis as typeof globalThis & {
  __churchPlanningRateLimitStore?: Map<string, RateLimitBucket>
}

function getStore() {
  if (!globalForRateLimit.__churchPlanningRateLimitStore) {
    globalForRateLimit.__churchPlanningRateLimitStore = new Map()
  }

  return globalForRateLimit.__churchPlanningRateLimitStore
}

function getBucket(key: string, windowMs: number) {
  const now = Date.now()
  const store = getStore()
  const bucket = store.get(key)

  if (!bucket || bucket.resetAt <= now) {
    const freshBucket = {
      count: 0,
      resetAt: now + windowMs,
    }
    store.set(key, freshBucket)
    return freshBucket
  }

  return bucket
}

export function isRateLimited(key: string, limit: number, windowMs = DEFAULT_WINDOW_MS) {
  const bucket = getBucket(key, windowMs)
  return bucket.count >= limit
}

export function recordRateLimitFailure(
  key: string,
  limit: number,
  windowMs = DEFAULT_WINDOW_MS
) {
  const bucket = getBucket(key, windowMs)
  bucket.count += 1
  getStore().set(key, bucket)
  return bucket.count >= limit
}

export function clearRateLimit(key: string) {
  getStore().delete(key)
}

export function getRequestIp(
  headers: Headers | Record<string, string | string[] | undefined> | null | undefined
) {
  if (!headers) return null

  if (headers instanceof Headers) {
    const forwarded = headers.get("x-forwarded-for")
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() || null
    }

    return headers.get("x-real-ip")
  }

  const forwarded = headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || null
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0]?.trim() || null
  }

  const realIp = headers["x-real-ip"]
  if (typeof realIp === "string" && realIp.length > 0) {
    return realIp
  }
  if (Array.isArray(realIp) && realIp[0]) {
    return realIp[0]
  }

  return null
}

export function buildRateLimitKeys(scope: string, options: { email?: string | null; ip?: string | null }) {
  const keys: string[] = []

  if (options.email) {
    keys.push(`${scope}:email:${options.email}`)
  }

  if (options.ip) {
    keys.push(`${scope}:ip:${options.ip}`)
  }

  if (keys.length === 0) {
    keys.push(`${scope}:global`)
  }

  return keys
}
