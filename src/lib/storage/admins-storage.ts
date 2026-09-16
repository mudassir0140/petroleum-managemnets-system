import { getStorageService } from "./localStorage-service";
import type { AdminAccount } from "@/lib/admin/types";

const COLLECTION = "admin_accounts";

// Seeded default admin account
const DEFAULT_ADMIN: AdminAccount = {
  id: "ADM-001",
  fullName: "Ali Raza",
  email: "admin@petromanage.demo",
  password: "admin123",
  createdAt: "2024-01-01T00:00:00Z",
};

export async function getStoredAdmins(): Promise<AdminAccount[]> {
  const service = getStorageService();
  const admins = service.readAll(COLLECTION) as AdminAccount[];

  // Always include default admin
  const hasDefault = admins.some((a) => a.id === DEFAULT_ADMIN.id);
  if (!hasDefault) {
    // Initialize with default admin
    service.create(COLLECTION, {
      ...DEFAULT_ADMIN,
      id: DEFAULT_ADMIN.id,
    });
    return [DEFAULT_ADMIN, ...admins];
  }

  return admins;
}

export async function createAdmin(account: AdminAccount): Promise<AdminAccount> {
  const service = getStorageService();
  const admins = await getStoredAdmins();

  // Check if email already exists
  if (admins.some((a) => a.email === account.email)) {
    throw new Error("Email already registered");
  }

  service.create(COLLECTION, {
    ...account,
    id: account.id,
  });
  return account;
}

export async function findAdminByEmail(email: string): Promise<AdminAccount | null> {
  const service = getStorageService();
  const data = service.findOne(
    COLLECTION,
    (item: any) => item.email?.toLowerCase() === email.toLowerCase()
  );
  return data ? (data as any) : null;
}

export async function findAdminById(id: string): Promise<AdminAccount | null> {
  const service = getStorageService();
  const data = service.read(COLLECTION, id);
  return data ? (data as any) : null;
}

export async function initializeAdmins(): Promise<void> {
  const service = getStorageService();
  const existing = service.read(COLLECTION, DEFAULT_ADMIN.id);
  if (!existing) {
    service.create(COLLECTION, {
      ...DEFAULT_ADMIN,
      id: DEFAULT_ADMIN.id,
    });
  }
}
