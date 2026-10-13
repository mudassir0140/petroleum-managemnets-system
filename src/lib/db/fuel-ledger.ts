import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import {
  DELIVERED_ORDER_STATUSES,
  dayKey,
  toLitres,
  type FuelLedger,
} from "@/lib/stock/ledger";

// Reads one pump's fuel ledger from MongoDB:
//   in  — "orders" for this pump and fuel, in a delivered state, dated by delivery
//   out — "meterReadings" per attendance: end reading minus start reading
export async function loadFuelLedger(pumpId: string, fuel: "petrol" | "diesel"): Promise<FuelLedger> {
  const db = await getDatabase();
  const pump = new ObjectId(pumpId);

  const orders = await db
    .collection("orders")
    .find({ pumpId: pump, fuelType: fuel, status: { $in: [...DELIVERED_ORDER_STATUSES] } })
    .project({ quantityLitres: 1, deliveredAt: 1, updatedAt: 1, requestedAt: 1, status: 1, trackingNumber: 1, driverName: 1 })
    .toArray();

  const receipts = orders.map((o: any) => ({
    id: String(o._id),
    date: dayKey(o.deliveredAt ?? o.updatedAt ?? o.requestedAt ?? new Date()),
    litres: toLitres(o.quantityLitres),
    status: String(o.status ?? ""),
    trackingNumber: o.trackingNumber || undefined,
    driverName: o.driverName || undefined,
  }));

  const readings = await db
    .collection("meterReadings")
    .find({ pumpId: pump, fuelType: fuel })
    .project({ attendanceId: 1, date: 1, type: 1, reading: 1 })
    .toArray();

  // One start and one end reading per attendance (shift).
  const shifts = new Map<string, { start?: number; end?: number; date: string }>();
  for (const r of readings as any[]) {
    const key = String(r.attendanceId);
    const shift = shifts.get(key) ?? { date: String(r.date ?? "") };
    if (r.type === "start") shift.start = toLitres(r.reading);
    if (r.type === "end") {
      shift.end = toLitres(r.reading);
      shift.date = String(r.date ?? shift.date);
    }
    shifts.set(key, shift);
  }

  const salesByDate: Record<string, number> = {};
  for (const shift of shifts.values()) {
    if (shift.start === undefined || shift.end === undefined || !shift.date) continue;
    const litres = shift.end - shift.start;
    if (litres <= 0) continue;
    salesByDate[shift.date] = (salesByDate[shift.date] ?? 0) + litres;
  }

  return { receipts, salesByDate };
}
