import { isAdminSessionValid } from "@/lib/auth/session-check";
import { NextRequest, NextResponse } from "next/server";
import { getTruckById, assignTruckToOrder } from "@/lib/db/truck-service";
import { getOrderById } from "@/lib/db/order-service";
import { updateOrderStatus } from "@/lib/db/order-service";
import { createNotification } from "@/lib/db/notification-service";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  // Only a signed-in Admin (checked against the admins collection) may assign trucks to orders.
  if (!(await isAdminSessionValid())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, truckId, driverId, driverName, estimatedArrival } = await request.json();

    if (!orderId || !truckId || !driverId || !driverName) {
      return NextResponse.json(
        { error: "orderId, truckId, driverId, and driverName are required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(orderId) || !ObjectId.isValid(truckId)) {
      return NextResponse.json({ error: "Invalid orderId or truckId" }, { status: 400 });
    }

    // Verify truck exists
    const truck = await getTruckById(truckId);
    if (!truck) {
      return NextResponse.json({ error: "Truck not found" }, { status: 404 });
    }

    // Get the order to find pump details
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const pumpId = order.pumpId.toString();

    // Assign truck to order
    await assignTruckToOrder(truckId, orderId, pumpId, driverId, driverName, estimatedArrival ? new Date(estimatedArrival) : undefined);

    // Update order status to "on-the-way"
    await updateOrderStatus(orderId, "on-the-way");

    // Create notification for driver
    await createNotification(
      driverId,
      "driver",
      "delivery-assigned",
      orderId,
      "Fuel Delivery Assigned",
      `You have been assigned a delivery of ${order.quantityLitres}L of ${order.fuelType} to ${order.pumpName}`,
      {
        truckId,
        pumpName: order.pumpName,
        fuelType: order.fuelType,
        quantityLitres: order.quantityLitres,
        estimatedArrival: estimatedArrival || new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour default
      }
    );

    // Create notification for pump owner
    const estimatedTime = estimatedArrival
      ? new Date(estimatedArrival).toLocaleTimeString()
      : "approximately 1 hour";

    await createNotification(
      order.requestedBy.toString(),
      "pump-owner",
      "delivery-en-route",
      orderId,
      "Fuel Delivery On The Way",
      `Your fuel delivery (${order.quantityLitres}L of ${order.fuelType}) is on the way. Estimated arrival: ${estimatedTime}`,
      {
        truckId,
        quantityLitres: order.quantityLitres,
        estimatedArrival: estimatedArrival || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        fuelType: order.fuelType,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Truck assigned and notifications sent",
      truckId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[AssignTruckAPI] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
