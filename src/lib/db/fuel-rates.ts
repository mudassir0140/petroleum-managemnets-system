"use server";

import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

export interface FuelRate {
  _id?: ObjectId;
  pumpId?: ObjectId | string;
  date: Date;
  petrolRate: number;
  dieselRate: number;
  source: string;
  updatedBy?: string;
  manualOverride?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCurrentFuelRates(pumpId?: string | ObjectId): Promise<FuelRate | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelRate>("fuel_rates");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query: any = { date: { $gte: today } };
    if (pumpId) {
      query.pumpId = pumpId instanceof ObjectId ? pumpId : new ObjectId(pumpId);
    }

    const rates = await collection.findOne(query, { sort: { updatedAt: -1 } });

    return rates || null;
  } catch (error) {
    console.error("[FuelRates] Error getting rates:", error);
    return null;
  }
}

export async function saveFuelRates(
  petrolRate: number,
  dieselRate: number,
  pumpId?: string | ObjectId,
  source: string = "manual",
  updatedBy: string = "system"
): Promise<FuelRate | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelRate>("fuel_rates");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query: any = { date: today };
    if (pumpId) {
      query.pumpId = pumpId instanceof ObjectId ? pumpId : new ObjectId(pumpId);
    }

    const now = new Date();

    // Check if document exists to preserve createdAt
    const existingDoc = await collection.findOne(query);
    const createdAt = existingDoc?.createdAt || now;

    const result = await collection.updateOne(
      query,
      {
        $set: {
          petrolRate,
          dieselRate,
          source,
          updatedBy,
          manualOverride: source === "manual",
          updatedAt: now,
          createdAt,
        },
      },
      { upsert: true }
    );

    return await getCurrentFuelRates(pumpId);
  } catch (error) {
    console.error("[FuelRates] Error saving rates:", error);
    return null;
  }
}

export async function getFuelRateHistory(days: number = 30, pumpId?: string | ObjectId): Promise<FuelRate[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelRate>("fuel_rates");

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const query: any = { date: { $gte: sinceDate } };
    if (pumpId) {
      query.pumpId = pumpId instanceof ObjectId ? pumpId : new ObjectId(pumpId);
    }

    return await collection
      .find(query)
      .sort({ date: -1, updatedAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[FuelRates] Error getting history:", error);
    return [];
  }
}

export async function getPreviousFuelRate(pumpId?: string | ObjectId): Promise<FuelRate | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelRate>("fuel_rates");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query: any = { date: { $lt: today } };
    if (pumpId) {
      query.pumpId = pumpId instanceof ObjectId ? pumpId : new ObjectId(pumpId);
    }

    const rates = await collection.findOne(query, { sort: { date: -1 } });

    return rates || null;
  } catch (error) {
    console.error("[FuelRates] Error getting previous rates:", error);
    return null;
  }
}
