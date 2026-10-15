import { cookies } from "next/headers";
import { endSupplierSession } from "@/lib/supplier/service";
import { SUPPLIER_COOKIE_NAME } from "@/lib/supplier/session";
import { jsonNoStore } from "@/lib/supplier/http";
import { performLogout } from "@/lib/auth/logout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUPPLIER_COOKIE_NAME)?.value;
  if (token) {
    await endSupplierSession(token).catch((error) => console.error("[SupplierLogout]", error));
  }
  await performLogout();
  return jsonNoStore({ success: true });
}
