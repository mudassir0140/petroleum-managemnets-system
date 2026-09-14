import fs from "fs";
import path from "path";
import { hashPassword } from "@/lib/auth/password";
import type { AttendantAccount } from "@/lib/attendant/types";

// File-backed "database" for the single seeded Fuel Attendant account used
// by Demo Role Login. Kept as its own store (rather than merged with
// pump-owners.json) since the two roles have different shapes.
const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "attendants.json");

function seedDemoAttendant(): AttendantAccount {
  // Joined to PUMP-014 (the seeded demo Pump Owner account), so the whole
  // attendant flow is testable immediately.
  return {
    id: "ATT-014",
    fullName: "Tariq Javed",
    email: "tariq.attendant@example.com",
    phone: "0321-4455667",
    username: "tariq.javed",
    pumpId: "PUMP-014",
    assignedShift: "morning",
    passwordHash: hashPassword("Shift@123"),
    createdAt: new Date("2025-02-01T00:00:00.000Z").toISOString(),
  };
}

function load(): AttendantAccount[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) {
    const seeded = [seedDemoAttendant()];
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

const accounts: AttendantAccount[] = load();

export function findAttendantById(id: string): AttendantAccount | null {
  return accounts.find((a) => a.id === id) ?? null;
}
