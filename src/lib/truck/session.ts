import { cache } from "react";
import { cookies } from "next/headers";
import { type Document, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { TRUCKS } from "./service";

export const TRUCK_COOKIE_NAME = "truck_session";

// The signed-in driver's truck, found by the random token stored on the truck record.
export const getTruckAccount = cache(async (): Promise<WithId<Document> | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(TRUCK_COOKIE_NAME)?.value;
  if (!token) return null;

  const db = await getDatabase();
  return db.collection(TRUCKS).findOne({ sessionToken: token });
});
