import { MongoClient, Db } from "mongodb";

// Cached on globalThis (not module scope) so warm serverless invocations and
// dev hot-reloads reuse one client instead of opening a new connection per request.
type MongoCache = {
  client: MongoClient | null;
  db: Db | null;
  connecting: Promise<MongoClient> | null;
};

const globalForMongo = globalThis as typeof globalThis & { __petroMongo?: MongoCache };
const cache: MongoCache = globalForMongo.__petroMongo ?? { client: null, db: null, connecting: null };
globalForMongo.__petroMongo = cache;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cache.client && cache.db) {
    return { client: cache.client, db: cache.db };
  }

  // Read environment variables at request time, not build time
  const MONGODB_URI = (process.env.MONGODB_URI || "").trim();
  const MONGODB_DB = (process.env.MONGODB_DB || "boot_auto_play").trim();

  if (!MONGODB_URI) {
    const error = new Error(
      "MONGODB_URI environment variable is not set. Please add it to Vercel -> Settings -> Environment Variables"
    );
    console.error("[MongoDB] Configuration error:", error.message);
    throw error;
  }

  // Share one in-flight connect between concurrent requests
  if (!cache.connecting) {
    cache.connecting = MongoClient.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    }).catch((error) => {
      cache.connecting = null;
      throw error;
    });
  }

  try {
    const client = await cache.connecting;
    cache.client = client;
    cache.db = client.db(MONGODB_DB);
    return { client, db: cache.db };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown connection error";
    console.error("[MongoDB] Connection failed:", {
      errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      database: MONGODB_DB,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`MongoDB connection failed: ${errorMessage}`);
  }
}

export async function closeDatabase(): Promise<void> {
  if (cache.client) {
    await cache.client.close();
    cache.client = null;
    cache.db = null;
    cache.connecting = null;
    console.log("[MongoDB] Connection closed");
  }
}

export async function getDatabase(): Promise<Db> {
  if (!cache.db) {
    const { db } = await connectToDatabase();
    return db;
  }
  return cache.db;
}
