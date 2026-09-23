"use server";

import { getDatabase } from "./mongodb";
import type { Truck } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "trucks";

export async function initializeTrucks(): Promise<void> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Truck>(COLLECTION_NAME);
    const count = await collection.countDocuments();

    if (count === 0) {
      // Create sample trucks if none exist
      const sampleTrucks = [
        { name: "Tanker-001", registrationNumber: "ABC-001", capacityLitres: 5000, status: "available" as const },
        { name: "Tanker-002", registrationNumber: "ABC-002", capacityLitres: 3000, status: "available" as const },
        { name: "Tanker-003", registrationNumber: "ABC-003", capacityLitres: 2000, status: "available" as const },
        { name: "Tanker-004", registrationNumber: "ABC-004", capacityLitres: 4000, status: "available" as const },
        { name: "Tanker-005", registrationNumber: "ABC-005", capacityLitres: 6000, status: "available" as const },
      ];

      await collection.insertMany(
        sampleTrucks.map((truck) => ({
          ...truck,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
      console.log("[TruckService] Created sample trucks");
    }
  } catch (error) {
    console.error("[TruckService] initializeTrucks error:", error);
  }
}

export async function getAvailableTrucks(quantityLitres: number): Promise<Truck[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Truck>(COLLECTION_NAME);
    return await collection
      .find({
        status: "available",
        capacityLitres: { $gte: quantityLitres },
      })
      .toArray();
  } catch (error) {
    console.error("[TruckService] getAvailableTrucks error:", error);
    return [];
  }
}

export async function getTruckById(truckId: string): Promise<Truck | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Truck>(COLLECTION_NAME);
    return await collection.findOne({ _id: new ObjectId(truckId) });
  } catch (error) {
    console.error("[TruckService] getTruckById error:", error);
    return null;
  }
}

export async function updateTruckStatus(
  truckId: string,
  status: "available" | "in-transit" | "maintenance" | "retired",
  orderId?: string,
  pumpId?: string
): Promise<Truck | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Truck>(COLLECTION_NAME);

    const setUpdate: any = {
      status,
      updatedAt: new Date(),
    };

    const unsetUpdate: any = {};

    if (orderId) {
      setUpdate.currentOrderId = new ObjectId(orderId);
    } else {
      unsetUpdate.currentOrderId = "";
    }

    if (pumpId) {
      setUpdate.currentPumpId = new ObjectId(pumpId);
    } else {
      unsetUpdate.currentPumpId = "";
    }

    const update: any = { $set: setUpdate };
    if (Object.keys(unsetUpdate).length > 0) {
      update.$unset = unsetUpdate;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(truckId) },
      update,
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[TruckService] updateTruckStatus error:", error);
    return null;
  }
}

export async function assignTruckToOrder(
  truckId: string,
  orderId: string,
  pumpId: string,
  driverId: string,
  driverName: string
): Promise<Truck | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Truck>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(truckId) },
      {
        $set: {
          status: "in-transit",
          driverId: new ObjectId(driverId),
          driverName,
          currentOrderId: new ObjectId(orderId),
          currentPumpId: new ObjectId(pumpId),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[TruckService] assignTruckToOrder error:", error);
    return null;
  }
}

export async function releaseTruck(truckId: string): Promise<Truck | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Truck>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(truckId) },
      {
        $unset: {
          driverId: "",
          driverName: "",
          currentOrderId: "",
          currentPumpId: "",
        },
        $set: {
          status: "available",
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[TruckService] releaseTruck error:", error);
    return null;
  }
}
