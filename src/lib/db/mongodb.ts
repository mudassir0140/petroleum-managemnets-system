import { MongoClient, Db } from "mongodb";

export const DEFAULT_DB_NAME = "petromanage";

// Thrown when MongoDB is not configured or cannot be reached. The message is
// safe to show to users: it never contains the connection string or password.
export class DatabaseUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

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
  const MONGODB_DB = (process.env.MONGODB_DB || DEFAULT_DB_NAME).trim();

  if (!MONGODB_URI) {
    const message = "Database is not configured: MONGODB_URI is not set.";
    console.error("[MongoDB] Configuration error: MONGODB_URI is not set");
    throw new DatabaseUnavailableError(message);
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
    // Log only the error type and code. Driver messages can echo connection details.
    const reason = error instanceof Error ? error.name : "UnknownError";
    const code = (error as { code?: unknown })?.code ?? null;
    console.error("[MongoDB] Connection failed:", {
      reason,
      code,
      database: MONGODB_DB,
      timestamp: new Date().toISOString(),
    });
    throw new DatabaseUnavailableError(
      `Could not connect to the database (${reason}). Check MONGODB_URI and MONGODB_DB in the environment settings.`
    );
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
