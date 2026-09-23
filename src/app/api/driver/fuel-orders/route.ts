import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getOrdersByDriver } from "@/lib/db/order-service";

async function getDriverId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("driver_session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    if (typeof session.driverId !== "string" || !ObjectId.isValid(session.driverId)) return null;
    return session.driverId;
  } catch {
    return null;
  }
}

const UNAUTHORIZED = { error: "Unauthorized — please log in as Driver first" };

export async function GET() {
  const driverId = await getDriverId();
  if (!driverId) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  const orders = await getOrdersByDriver(driverId);
  return NextResponse.json({
    success: true,
    orders: orders.map((o) => ({ ...o, pumpId: o.pumpId.toString(), requestedBy: o.requestedBy.toString(), driverId: o.driverId?.toString() })),
  });
}
