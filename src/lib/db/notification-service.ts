"use server";

import { getDatabase } from "./mongodb";
import type { Notification } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "notifications";

export async function createNotification(
  recipientId: string,
  recipientType: "driver" | "pump-owner",
  type: "delivery-assigned" | "delivery-en-route" | "delivery-arrived" | "delivery-completed",
  orderId: string,
  title: string,
  message: string,
  data?: any
): Promise<Notification> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Notification>(COLLECTION_NAME);

    const notification: Notification = {
      recipientId: new ObjectId(recipientId),
      recipientType,
      type,
      orderId: new ObjectId(orderId),
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(notification);
    return { ...notification, _id: result.insertedId };
  } catch (error) {
    console.error("[NotificationService] createNotification error:", error);
    throw error;
  }
}

export async function getNotifications(
  recipientId: string,
  recipientType: "driver" | "pump-owner",
  limit: number = 20
): Promise<Notification[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Notification>(COLLECTION_NAME);
    return await collection
      .find({
        recipientId: new ObjectId(recipientId),
        recipientType,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error("[NotificationService] getNotifications error:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<Notification | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Notification>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(notificationId) },
      {
        $set: {
          read: true,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[NotificationService] markNotificationAsRead error:", error);
    return null;
  }
}

export async function getOrderNotifications(orderId: string): Promise<Notification[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Notification>(COLLECTION_NAME);
    return await collection
      .find({ orderId: new ObjectId(orderId) })
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[NotificationService] getOrderNotifications error:", error);
    return [];
  }
}
