import test from "node:test"
import assert from "node:assert/strict"
import { getBackupDownloadName } from "@/lib/backup-storage"

test("getBackupDownloadName supports supabase-backed objects", () => {
  const fileName = getBackupDownloadName(
    "supabase:church123/church123-manual-20260316123456.json",
    "backup1"
  )

  assert.equal(fileName, "church123-manual-20260316123456.json")
})

test("getBackupDownloadName preserves legacy local names", () => {
  const fileName = getBackupDownloadName("/backups/backup-seed.zip", "backup2")

  assert.equal(fileName, "backup-seed.zip")
})

test("getBackupDownloadName falls back to backup id when missing storage url", () => {
  const fileName = getBackupDownloadName(null, "backup3")

  assert.equal(fileName, "backup3.json")
})
