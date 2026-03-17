import test from "node:test"
import assert from "node:assert/strict"
import {
  buildRateLimitKeys,
  clearRateLimit,
  getRequestIp,
  isRateLimited,
  recordRateLimitFailure,
} from "@/lib/auth-rate-limit"

test("rate limit blocks after configured number of failures and can be cleared", () => {
  const key = "test:login:user@example.com"

  clearRateLimit(key)
  assert.equal(isRateLimited(key, 2), false)

  recordRateLimitFailure(key, 2)
  assert.equal(isRateLimited(key, 2), false)

  recordRateLimitFailure(key, 2)
  assert.equal(isRateLimited(key, 2), true)

  clearRateLimit(key)
  assert.equal(isRateLimited(key, 2), false)
})

test("buildRateLimitKeys includes email and ip when present", () => {
  const keys = buildRateLimitKeys("login", {
    email: "user@example.com",
    ip: "127.0.0.1",
  })

  assert.deepEqual(keys, [
    "login:email:user@example.com",
    "login:ip:127.0.0.1",
  ])
})

test("getRequestIp reads forwarded and real ip headers", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.1",
  })

  assert.equal(getRequestIp(headers), "203.0.113.10")
  assert.equal(getRequestIp({ "x-real-ip": "198.51.100.8" }), "198.51.100.8")
})
