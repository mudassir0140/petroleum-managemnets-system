import { cookies } from "next/headers";
import { endTruckSession } from "@/lib/truck/service";
import { TRUCK_COOKIE_NAME } from "@/lib/truck/session";
import { jsonNoStore } from "@/lib/supplier/http";
import { performLogout } from "@/lib/auth/logout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TRUCK_COOKIE_NAME)?.value;
  if (token) await endTruckSession(token).catch((error) => console.error("[TruckLogout]", error));
  await performLogout();
  return jsonNoStore({ success: true });
}
