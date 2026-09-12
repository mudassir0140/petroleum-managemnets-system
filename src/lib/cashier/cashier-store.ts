import fs from "fs";
import path from "path";
import { hashPassword } from "@/lib/auth/password";
import type { CashierAccount } from "@/lib/cashier/types";

// File-backed "database" for the single seeded Cashier account used by Demo
// Role Login. Kept as its own store since each role has a different shape.
const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "cashiers.json");

function seedDemoCashier(): CashierAccount {
  // Joined to PUMP-014 (the seeded demo Pump Owner account), so the whole
  // cashier flow is testable immediately.
  return {
    id: "CSH-014",
    fullName: "Hamza Farooq",
    email: "hamza.cashier@example.com",
    phone: "0333-2211445",
    username: "hamza.farooq",
    pumpId: "PUMP-014",
    assignedShift: "morning",
    passwordHash: hashPassword("Cash@1234"),
    createdAt: new Date("2025-02-05T00:00:00.000Z").toISOString(),
  };
}

function load(): CashierAccount[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) {
    const seeded = [seedDemoCashier()];
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

const accounts: CashierAccount[] = load();

export function findCashierById(id: string): CashierAccount | null {
  return accounts.find((a) => a.id === id) ?? null;
}
