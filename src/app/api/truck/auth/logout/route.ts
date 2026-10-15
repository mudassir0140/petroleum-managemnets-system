import { endSession } from "@/lib/auth/logout";
import { jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Same logout as every other role: ends the driver token and expires the cookie.
export async function POST() {
  await endSession();
  return jsonNoStore({ success: true });
}
