"use server";

import { ensureDataDir } from "./file-storage";
import { initializePumpIndexes } from "./pumps";
import { initializeEmployeeIndexes } from "./employees";
import { initializeUserIndexes } from "./users";
import { initializeApprovalIndexes } from "./approvals";
import { initializeManagerIndexes } from "./managers";

export async function initializeDatabase(): Promise<void> {
  console.log("[FileStorage] Initializing database...");

  try {
    await ensureDataDir();

    await Promise.all([
      initializePumpIndexes(),
      initializeEmployeeIndexes(),
      initializeUserIndexes(),
      initializeApprovalIndexes(),
      initializeManagerIndexes(),
    ]);

    console.log("[FileStorage] Database initialization complete");
  } catch (error) {
    console.error("[FileStorage] Initialization error:", error);
    throw error;
  }
}
