import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const MONGODB_URI: string = process.env.MONGODB_URI || "";
const MONGODB_DB: string = process.env.MONGODB_DB || "boot_auto_play";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = await MongoClient.connect(MONGODB_URI);
    cachedClient = client;
    cachedDb = client.db(MONGODB_DB);

    console.log("[MongoDB] Connected to MongoDB Atlas");
    return { client, db: cachedDb };
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error);
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
  if (!cachedDb) {
    const { db } = await connectToDatabase();
    return db;
  }
  return cachedDb;
}
