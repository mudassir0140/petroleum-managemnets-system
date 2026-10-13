import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { endSupplierSession } from "@/lib/supplier/service";
import { SUPPLIER_COOKIE_NAME } from "@/lib/supplier/session";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUPPLIER_COOKIE_NAME)?.value;
  if (token) {
    await endSupplierSession(token).catch((error) => console.error("[SupplierLogout]", error));
  }
  cookieStore.delete(SUPPLIER_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
