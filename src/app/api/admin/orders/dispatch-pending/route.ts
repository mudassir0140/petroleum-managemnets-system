import { NextRequest, NextResponse } from "next/server";
import { getTruckById, assignTruckToOrder } from "@/lib/db/truck-service";
import { getOrdersByPump, updateOrderStatus } from "@/lib/db/order-service";
import { createNotification } from "@/lib/db/notification-service";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const { orderId, truckId, driverId, driverName, departureTime, arrivalTime } = await request.json();

    if (!orderId || !truckId || !driverId || !driverName || !departureTime || !arrivalTime) {
      return NextResponse.json(
        { error: "orderId, truckId, driverId, driverName, departureTime, and arrivalTime are required" },
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
    const allOrders = await getOrdersByPump(new ObjectId(orderId).toString());
    const order = allOrders.find((o) => o._id?.toString() === orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending orders can be dispatched" },
        { status: 400 }
      );
    }

    const pumpId = order.pumpId.toString();
    const departureDate = new Date(departureTime);
    const arrivalDate = new Date(arrivalTime);

    if (departureDate >= arrivalDate) {
      return NextResponse.json(
        { error: "Arrival time must be after departure time" },
        { status: 400 }
      );
    }

    // Assign truck to order
    await assignTruckToOrder(truckId, orderId, pumpId, driverId, driverName);

    // Update order status to "dispatched"
    await updateOrderStatus(orderId, "dispatched");

    // Calculate duration for driver notification
    const durationHours = Math.round((arrivalDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60));

    // Create notification for driver
    await createNotification(
      driverId,
      "driver",
      "delivery-assigned",
      orderId,
      "Fuel Delivery Dispatch Order",
      `You have been assigned a delivery of ${order.quantityLitres}L of ${order.fuelType} to ${order.pumpName}. Departs at ${departureDate.toLocaleTimeString()}, estimated arrival ${arrivalDate.toLocaleTimeString()} (${durationHours}h delivery)`,
      {
        truckId,
        truckName: truck.name,
        pumpName: order.pumpName,
        fuelType: order.fuelType,
        quantityLitres: order.quantityLitres,
        departureTime: departureTime,
        estimatedArrival: arrivalTime,
        location: order.pumpName,
      }
    );

    // Create notification for pump owner
    await createNotification(
      order.requestedBy.toString(),
      "pump-owner",
      "delivery-en-route",
      orderId,
      "Fuel Delivery Dispatched",
      `Your fuel delivery of ${order.quantityLitres}L ${order.fuelType} has been dispatched. Truck ${truck.name} will arrive at ${arrivalDate.toLocaleTimeString()}`,
      {
        truckId,
        truckName: truck.name,
        quantityLitres: order.quantityLitres,
        estimatedArrival: arrivalTime,
        departureTime: departureTime,
        fuelType: order.fuelType,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Order dispatched and notifications sent",
      truckId,
      status: "dispatched",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DispatchPendingAPI] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
