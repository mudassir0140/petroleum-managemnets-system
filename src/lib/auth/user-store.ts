import fs from "fs";
import path from "path";
import { hashPassword } from "@/lib/auth/password";

// File-backed "database" for the single seeded Pump Owner account used by
// Demo Role Login. Persisted to a JSON file under /data (see .gitignore)
// rather than an in-memory array so it survives a dev server restart.
export interface PumpOwnerAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  pumpId: string;
  pumpName: string;
  pumpLocation: string;
  passwordHash: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "pump-owners.json");

function seedDemoAccount(): PumpOwnerAccount {
  // Matches PUMP-014 / "Fahad Malik" in lib/demo-data.ts's static PUMPS
  // registry, so the rich seeded demo data is reachable immediately.
  return {
    id: "OWN-014",
    fullName: "Fahad Malik",
    email: "fmkports@gmail.com",
    phone: "0300-1234567",
    username: "fahad.malik",
    pumpId: "PUMP-014",
    pumpName: "Al-Falah Fuel Station",
    pumpLocation: "Ferozepur Road, Lahore",
    passwordHash: hashPassword("Petrol@123"),
    createdAt: new Date("2025-01-05T00:00:00.000Z").toISOString(),
  };
}

function load(): PumpOwnerAccount[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) {
    const seeded = [seedDemoAccount()];
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

const accounts: PumpOwnerAccount[] = load();

export function findAccountById(id: string): PumpOwnerAccount | null {
  return accounts.find((a) => a.id === id) ?? null;
}

export function findAccountByPumpId(pumpId: string): PumpOwnerAccount | null {
  return accounts.find((a) => a.pumpId === pumpId) ?? null;
}
