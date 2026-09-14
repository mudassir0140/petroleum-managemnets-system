import fs from "fs";
import path from "path";
import { hashPassword } from "@/lib/auth/password";
import type { SecurityGuardAccount } from "@/lib/security-guard/types";

// File-backed "database" for the single seeded Security Guard account used
// by Demo Role Login. Kept as its own store (rather than merged with
// attendants.json) since the two roles have different shapes.
const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "security-guards.json");

function seedDemoGuard(): SecurityGuardAccount {
  // Joined to PUMP-014 (the same seeded demo pump as the Attendant, Cashier
  // and Pump Owner demo accounts), so the whole self-service flow is
  // testable together against one pump.
  return {
    id: "SEC-014",
    fullName: "Rashid Mahmood",
    email: "rashid.guard@example.com",
    phone: "0333-2211445",
    username: "rashid.mahmood",
    pumpId: "PUMP-014",
    assignedShift: "night",
    passwordHash: hashPassword("Guard@123"),
    createdAt: new Date("2025-02-01T00:00:00.000Z").toISOString(),
  };
}

function load(): SecurityGuardAccount[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) {
    const seeded = [seedDemoGuard()];
    fs.writeFileSync(FILE_PATH, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const accounts: SecurityGuardAccount[] = load();

export function findGuardById(id: string): SecurityGuardAccount | null {
  return accounts.find((a) => a.id === id) ?? null;
}
