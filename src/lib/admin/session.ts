import { cache } from "react";
import { requireDemoRole } from "@/lib/demo/session";
import type { AdminSession } from "@/lib/admin/types";

// Demo Role Login: picking "Admin" always signs you in as this fixed demo
// account. There's no per-pump scoping for Admin — it's a read-only,
// network-wide view across every pump in lib/demo-data.ts's PUMPS registry.
export const getAdminSession = cache(async (): Promise<AdminSession> => {
  await requireDemoRole("admin");

  return {
    adminId: "ADM-001",
    adminName: "Ali Raza",
    adminEmail: "admin@petromanage.demo",
    role: "admin",
  };
});
