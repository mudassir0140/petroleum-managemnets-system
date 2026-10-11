import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Read environment variables at request time, not build time
  const MONGODB_URI = (process.env.MONGODB_URI || "").trim();
  const MONGODB_DB = (process.env.MONGODB_DB || "boot_auto_play").trim();

  // Debug logging for environment variables
  console.log("[MongoDB] Reading environment - URI exists:", !!MONGODB_URI, "DB:", MONGODB_DB);

  if (!MONGODB_URI) {
    const error = new Error(
      "MONGODB_URI environment variable is not set. Please add it to Vercel -> Settings -> Environment Variables"
    );
    console.error("[MongoDB] Configuration error:", error.message);
    console.error("[MongoDB] Available env vars:", Object.keys(process.env).filter(k => k.includes("MONGO")).sort());
    throw error;
  }

  try {
    console.log("[MongoDB] Attempting to connect to database:", MONGODB_DB);
    const client = await MongoClient.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    cachedClient = client;
    cachedDb = client.db(MONGODB_DB);

    console.log("[MongoDB] Successfully connected to MongoDB Atlas, database:", MONGODB_DB);
    return { client, db: cachedDb };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown connection error";
    console.error("[MongoDB] Connection failed - Full details:", {
      errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      database: MONGODB_DB,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`MongoDB connection failed: ${errorMessage}`);
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
