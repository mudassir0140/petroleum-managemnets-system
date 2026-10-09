"use server";

import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

export interface FuelRate {
  _id?: ObjectId;
  date: Date;
  petrolRate: number;
  dieselRate: number;
  source: string;
  manualOverride?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCurrentFuelRates(): Promise<FuelRate | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelRate>("fuel_rates");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rates = await collection.findOne({
      date: { $gte: today }
    }, { sort: { date: -1 } });

    return rates || null;
  } catch (error) {
    console.error("[FuelRates] Error getting rates:", error);
    return null;
  }
}

export async function saveFuelRates(
  petrolRate: number,
  dieselRate: number,
  source: string = "manual",
  manualOverride: boolean = false
): Promise<FuelRate | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelRate>("fuel_rates");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await collection.updateOne(
      { date: today },
      {
        $set: {
          petrolRate,
          dieselRate,
          source,
          manualOverride,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return await getCurrentFuelRates();
  } catch (error) {
    console.error("[FuelRates] Error saving rates:", error);
    return null;
  }
}

export async function getFuelRateHistory(days: number = 30): Promise<FuelRate[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelRate>("fuel_rates");

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return await collection
      .find({ date: { $gte: sinceDate } })
      .sort({ date: -1 })
      .toArray();
  } catch (error) {
    console.error("[FuelRates] Error getting history:", error);
    return [];
  }
}
