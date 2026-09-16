// Note: MongoDB is no longer used. System uses localStorage for persistence.
// These functions are kept as no-ops for backward compatibility.

export async function connectToDatabase(): Promise<{ client: any; db: any }> {
  console.log("[Storage] Using localStorage for data persistence");
  return { client: null, db: null };
}

export async function closeDatabase(): Promise<void> {
  console.log("[Storage] localStorage cleanup");
}

export async function getDatabase(): Promise<any> {
  console.log("[Storage] Using localStorage");
  return null;
}
