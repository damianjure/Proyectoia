import test from "node:test"
import assert from "node:assert/strict"
import { buildBackupFilename } from "@/lib/backup-utils"

test("buildBackupFilename creates deterministic backup names", () => {
  const createdAt = new Date("2026-03-16T12:34:56.000Z")
  const fileName = buildBackupFilename("church123", "MANUAL", createdAt)

  assert.equal(fileName, "church123-manual-20260316123456.json")
})
