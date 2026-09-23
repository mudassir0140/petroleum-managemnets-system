"use server";

import { getDatabase } from "./mongodb";
import type { Invoice } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "invoices";

export async function createInvoice(
  invoice: Omit<Invoice, "_id" | "createdAt" | "updatedAt">
): Promise<Invoice> {
  const db = await getDatabase();
  const collection = db.collection<Invoice>(COLLECTION_NAME);

  const doc: Invoice = {
    ...invoice,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Invoice>(COLLECTION_NAME);
    return await collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error("[InvoiceService] Get error:", error);
    return null;
  }
}

export async function getInvoicesByOrder(orderId: string): Promise<Invoice[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Invoice>(COLLECTION_NAME);
    return await collection.find({ orderId: new ObjectId(orderId) }).toArray();
  } catch (error) {
    console.error("[InvoiceService] getInvoicesByOrder error:", error);
    return [];
  }
}

export async function getInvoicesByPump(pumpId: string): Promise<Invoice[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Invoice>(COLLECTION_NAME);
    return await collection
      .find({ pumpId: new ObjectId(pumpId) })
      .sort({ issuedAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[InvoiceService] getInvoicesByPump error:", error);
    return [];
  }
}
