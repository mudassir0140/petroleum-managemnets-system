import { cookies } from "next/headers";
import { endSupplierSession } from "@/lib/supplier/service";
import { SUPPLIER_COOKIE_NAME } from "@/lib/supplier/session";
import { jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUPPLIER_COOKIE_NAME)?.value;
  if (token) {
    await endSupplierSession(token).catch((error) => console.error("[SupplierLogout]", error));
  }
  cookieStore.delete(SUPPLIER_COOKIE_NAME);
  return jsonNoStore({ success: true });
}
