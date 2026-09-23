"use server";

import { getDatabase } from "./mongodb";
import { getAllPumps } from "./pump-service";

const SALES_COLLECTION_NAME = "sales";

// Reads the "sales" collection (SaleRecord, see sales-service.ts) directly
// rather than importing from it, to stay decoupled from that service's own
// evolving surface — this only ever needs a read-only aggregate.
interface SalesTotals {
  petrolLitres: number;
  dieselLitres: number;
  revenue: number;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getStockOverview() {
  const pumps = await getAllPumps();
  return {
    totalPetrolStock: pumps.reduce((sum, p) => sum + (p.petrolStock || 0), 0),
    totalPetrolCapacity: pumps.reduce((sum, p) => sum + (p.petrolCapacity || 0), 0),
    totalDieselStock: pumps.reduce((sum, p) => sum + (p.dieselStock || 0), 0),
    totalDieselCapacity: pumps.reduce((sum, p) => sum + (p.dieselCapacity || 0), 0),
    perPump: pumps.map((p) => ({
      pumpId: p._id!.toString(),
      name: p.name,
      city: p.city,
      status: p.status,
      petrolStock: p.petrolStock,
      petrolCapacity: p.petrolCapacity,
      dieselStock: p.dieselStock,
      dieselCapacity: p.dieselCapacity,
    })),
  };
}

export async function getTodaySalesSummary(): Promise<SalesTotals & { pumpsReporting: number }> {
  try {
    const db = await getDatabase();
    const collection = db.collection(SALES_COLLECTION_NAME);
    const today = todayDateString();

    const rows = await collection.find({ date: today }).toArray();
    const pumpIds = new Set(rows.map((r: any) => String(r.pumpId)));

    return {
      petrolLitres: rows.reduce((sum: number, r: any) => sum + (r.petrolLitres || 0), 0),
      dieselLitres: rows.reduce((sum: number, r: any) => sum + (r.dieselLitres || 0), 0),
      revenue: rows.reduce((sum: number, r: any) => sum + (r.revenue || 0), 0),
      pumpsReporting: pumpIds.size,
    };
  } catch (error) {
    console.error("[FuelOverviewService] getTodaySalesSummary error:", error);
    return { petrolLitres: 0, dieselLitres: 0, revenue: 0, pumpsReporting: 0 };
  }
}
