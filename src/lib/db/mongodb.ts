import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/petromanage";
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    console.log("[MongoDB] Using cached connection");
    return { client: cachedClient, db: cachedDb };
  }

  try {
    console.log("[MongoDB] Connecting to:", uri);
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db();
    cachedClient = client;
    cachedDb = db;

    console.log("[MongoDB] Connected successfully");
    return { client, db };
  } catch (error) {
    console.error("[MongoDB] Connection error:", error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log("[MongoDB] Connection closed");
  }
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}
