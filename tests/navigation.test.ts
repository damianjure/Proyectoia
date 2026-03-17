import test from "node:test"
import assert from "node:assert/strict"
import { filterNavigationItems } from "@/lib/navigation"

test("filterNavigationItems keeps public items and allowed permissions", () => {
  const items = [
    { href: "/", label: "Inicio" },
    { href: "/services", label: "Servicios", permission: "services.view" as const },
    { href: "/reports", label: "Reportes", permission: "reports.view" as const },
  ]

  const result = filterNavigationItems(items, {
    "services.view": true,
    "reports.view": false,
  })

  assert.deepEqual(result.map((item) => item.href), ["/", "/services"])
})
