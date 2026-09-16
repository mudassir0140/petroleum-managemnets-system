"use server";

import { initializePumpIndexes } from "./pumps";
import { initializeEmployeeIndexes } from "./employees";
import { initializeUserIndexes } from "./users";
import { initializeApprovalIndexes } from "./approvals";

export async function initializeDatabase(): Promise<void> {
  console.log("[MongoDB] Initializing database indexes...");

  try {
    await Promise.all([
      initializePumpIndexes(),
      initializeEmployeeIndexes(),
      initializeUserIndexes(),
      initializeApprovalIndexes(),
    ]);

    console.log("[MongoDB] Database initialization complete");
  } catch (error) {
    console.error("[MongoDB] Initialization error:", error);
    throw error;
  }
}
