import test from "node:test"
import assert from "node:assert/strict"
import { isDevAuthBypassEnabled } from "@/lib/dev-auth"

test("dev auth bypass is disabled outside non-production true flag combination", () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalSkipAuth = process.env.SKIP_AUTH

  Object.assign(process.env, {
    NODE_ENV: "production",
    SKIP_AUTH: "true",
  })
  assert.equal(isDevAuthBypassEnabled(), false)

  Object.assign(process.env, {
    NODE_ENV: "development",
    SKIP_AUTH: "false",
  })
  assert.equal(isDevAuthBypassEnabled(), false)

  Object.assign(process.env, {
    NODE_ENV: "development",
    SKIP_AUTH: "true",
  })
  assert.equal(isDevAuthBypassEnabled(), true)

  Object.assign(process.env, {
    NODE_ENV: originalNodeEnv,
    SKIP_AUTH: originalSkipAuth,
  })
})
