# Complete Fuel Request Workflow Implementation

## Overview
This document describes the comprehensive fuel request workflow implemented in the Petroleum Management System. The system enables pump owners to request fuel, managers to dispatch orders, drivers to confirm delivery, and pump owners to confirm receipt.

## Complete Flow

```
Pump Owner Request → Manager Review → Driver Assignment → Delivery → Confirmations → Completed
```

### 1. **Pump Owner Requests Fuel**
- **Page**: `/pump-owner/dashboard/fuel-orders`
- **Action**: Pump owner fills out FuelOrderForm with:
  - Fuel type (Petrol or Diesel)
  - Quantity in litres
  - Optional notes
- **API**: POST `/api/pump-owner/fuel-orders`
- **Status**: Order created with status = "pending"
- **Data Stored**: pumpId, pumpName, fuelType, quantityLitres, notes, requestedAt

### 2. **Admin Accepts & Assigns Driver**
- **Page**: `/admin/(dashboard)/fuel-management`
- **Action**: Admin can:
  - View all pending orders from all pumps
  - Create orders manually
  - Assign driver to order (requires driverId, driverName, trackingNumber, expectedArrival)
- **API**: PUT `/api/admin/orders` with driverId, driverName, trackingNumber, expectedArrival
- **Status Changes**: pending → accepted → dispatched
- **Data Updated**: driverId, driverName, trackingNumber, expectedArrival, dispatchedAt

### 3. **Manager Marks "On The Way"**
- **Page**: `/manager/fuel-orders`
- **Action**: Manager reviews orders and marks them as "on the way" once dispatched
- **API**: PUT `/api/manager/fuel-orders` with status = "on-the-way"
- **Status Changes**: accepted → on-the-way
- **Pump Owner Visibility**: Pump owner now sees order with ETA

### 4. **Pump Owner Sees ETA & Status**
- **Page**: `/pump-owner/dashboard/fuel-orders`
- **Display**: 
  - Order status badge (on-the-way, delivered, etc.)
  - Expected arrival time
  - Driver name and tracking number
  - Confirmation status (Driver ✓, You ✓)
- **Action**: Once status is "on-the-way" or "delivered", pump owner can click "Confirm" button
- **When Visible**: Confirmation button appears when status ≥ "on-the-way"

### 5. **Driver Confirms Delivery**
- **Page**: `/dashboard/driver/fuel-orders`
- **Display**:
  - List of all assigned deliveries
  - Status badges
  - ETA and confirmation status
- **Action**: Driver clicks "Confirm" on delivery
- **API**: PUT `/api/driver/confirm-delivery` with orderId
- **Data Updated**: driverConfirmedAt = now()
- **Status**: Remains "delivered" (or "completed" if pump owner already confirmed)

### 6. **Pump Owner Confirms Delivery**
- **Page**: `/pump-owner/dashboard/fuel-orders`
- **Action**: Pump owner clicks "Confirm Delivery"
- **Dialog**: Shows confirmation message
- **API**: PUT `/api/pump-owner/confirm-delivery` with orderId
- **Data Updated**: pumpOwnerConfirmedAt = now()
- **Status Update**: 
  - If driver already confirmed: status → "completed"
  - Otherwise: remains "delivered"

### 7. **Order Marked Completed**
- **Trigger**: Both confirmations present (driverConfirmedAt AND pumpOwnerConfirmedAt)
- **Status**: "completed"
- **Visibility**: Admin sees completed status in fuel-management page

## Data Model

### FuelOrder Status Flow
```
pending
  ↓
accepted (after admin accepts)
  ↓
dispatched (after admin assigns driver)
  ↓
on-the-way (after manager marks on the way)
  ↓
delivered (driver/pump owner marks)
  ↓
completed (both driver AND pump owner confirmed)
  ↓
payment-pending (after invoice created)
  ↓
paid → cleared
```

### FuelOrder Fields
```typescript
{
  _id: ObjectId;
  pumpId: ObjectId;
  pumpName: string;
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  status: string;
  notes?: string;
  
  // Timestamps
  requestedAt: Date;
  acceptedAt?: Date;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  driverConfirmedAt?: Date;        // ← NEW
  pumpOwnerConfirmedAt?: Date;     // ← NEW
  
  // Driver Assignment
  driverId?: ObjectId;
  driverName?: string;
  trackingNumber?: string;
  expectedArrival?: Date;
  
  // Financial
  invoiceId?: ObjectId;
  totalAmount?: number;
  
  // Metadata
  requestedBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### Pump Owner
- **GET** `/api/pump-owner/fuel-orders` - List orders for their pump
- **POST** `/api/pump-owner/fuel-orders` - Create new fuel order
- **PUT** `/api/pump-owner/confirm-delivery` - Confirm delivery receipt

### Manager
- **GET** `/api/manager/fuel-orders` - List orders for their pump(s)
- **PUT** `/api/manager/fuel-orders` - Mark order "on-the-way" or "accepted"

### Driver
- **GET** `/api/driver/fuel-orders` - List assigned deliveries
- **PUT** `/api/driver/confirm-delivery` - Confirm delivery completion

### Admin
- **GET** `/api/admin/orders` - List all orders (unchanged)
- **POST** `/api/admin/orders` - Create order (unchanged)
- **PUT** `/api/admin/orders` - Assign driver or update status (updated to support new statuses)

## Pages & Components

### Pump Owner Dashboard
- **Component**: `FuelOrderForm` - Request fuel
- **Component**: `FuelOrdersList` - View orders with confirmation options
- **Page**: `/pump-owner/dashboard/fuel-orders`
- **Features**:
  - Submit fuel requests
  - View order status and ETA
  - Confirm delivery
  - See driver confirmation status

### Manager Dashboard  
- **Page**: `/manager/fuel-orders`
- **Component**: `ManagerFuelOrdersClient`
- **Features**:
  - View all pending/accepted orders
  - Mark orders "On The Way"
  - See driver and pump owner confirmation status
  - Grouped view by status

### Admin Dashboard
- **Page**: `/admin/(dashboard)/fuel-management`
- **Component**: `OrdersManager`
- **Features**:
  - See order count per pump
  - Assign drivers to orders
  - Create invoices
  - Mark orders as delivered
  - Updated status handling (supports "on-the-way", "completed")

### Driver Dashboard
- **Page**: `/dashboard/driver/fuel-orders` (NEW)
- **Features**:
  - View assigned deliveries
  - See ETA and confirmation status
  - Confirm delivery
  - Stats: total deliveries, ready to confirm, confirmed count, total volume

## Service Layer

### order-service.ts Functions
- `createOrder()` - Create new fuel order
- `getAllOrders()` - Get all orders
- `getOrdersByPump()` - Get orders for specific pump
- `updateOrderStatus()` - Update order status (now supports "on-the-way", "completed")
- `updateOrderWithDriver()` - Assign driver to order
- `updateOrderWithInvoice()` - Create invoice for order
- `getOrdersByDriver()` - Get orders assigned to driver
- `confirmDeliveryByDriver()` - Mark driver confirmation
- `confirmDeliveryByPumpOwner()` - Mark pump owner confirmation (auto-completes if driver confirmed)

## Status Badges & Colors

| Status | Color | Usage |
|--------|-------|-------|
| pending | Yellow | Order just created, awaiting acceptance |
| accepted | Blue | Admin accepted, ready for assignment |
| on-the-way | Cyan | **NEW** - Manager marked, en route to pump |
| dispatched | Sky | Admin assigned driver |
| delivered | Purple | Arrived at pump, awaiting confirmations |
| completed | Emerald | **NEW** - Both driver and pump owner confirmed |
| payment-pending | Orange | Invoice created, awaiting payment |
| paid | Green | Payment received |
| cleared | Emerald | Fully settled |

## Key Features

### Dual Confirmation System
- ✅ **Driver confirmation**: Confirms fuel was loaded onto truck and delivered
- ✅ **Pump owner confirmation**: Confirms fuel was received in good condition
- ✅ **Automatic completion**: Order automatically marked "completed" when both confirm

### ETA Tracking
- **When visible**: Once status is "on-the-way"
- **Format**: Time of expected arrival
- **Source**: Set by admin when assigning driver

### Confirmation Status Display
- **Table column**: Shows checkmarks for driver and pump owner
- **Visual**: ✓ Driver, ✓ You (for pump owner view)
- **Color coding**: Green when confirmed, gray when pending

### Real-time MongoDB Storage
- All changes persisted immediately to MongoDB
- All dashboard pages reflect live status changes
- No batch processing or delays

## Testing the Complete Flow

### Test Scenario
1. Login as **Pump Owner**
2. Navigate to `/pump-owner/dashboard/fuel-orders`
3. Fill form: Petrol, 1000L
4. Click "Request Fuel"
5. Login as **Admin**
6. Navigate to `/admin/(dashboard)/fuel-management`
7. See pending order
8. Assign driver: Click "→ accepted"
9. See "Assign Driver" modal
10. Fill: John Doe, TRK-001, Future time
11. Click "Assign Driver"
12. Login as **Manager**
13. Navigate to `/manager/fuel-orders`
14. See order in "accepted" section
15. Click "Mark on the way"
16. Login as **Pump Owner**
17. Refresh fuel orders page
18. See order with "On The Way" status and ETA
19. Click "Confirm" button
20. See confirmation dialog
21. Click "Confirm Delivery"
22. Login as **Driver**
23. Navigate to `/dashboard/driver/fuel-orders`
24. See assigned delivery
25. Click "Confirm Delivery"
26. Both confirmations show as complete (✓ Driver, ✓ You)
27. Status changes to "completed"
28. Login as **Admin**
29. See order marked "completed" in fuel-management

## Architecture Notes

- **No direct API calls between roles**: Each role uses their own API endpoints
- **Authorization checks**: All endpoints verify the requesting user owns/is assigned to the order
- **Idempotent confirmations**: Confirming twice doesn't break anything
- **Cascade completion**: Pump owner confirmation auto-completes if driver already confirmed
- **Live updates**: Pages use reload or manual refresh (no real-time sockets)

## Future Enhancements

1. **Real-time updates**: WebSocket integration for live order status
2. **Notifications**: Email/SMS alerts for status changes
3. **Historical tracking**: Delivery photos, GPS tracking
4. **Partial deliveries**: Split orders if not all quantity delivered
5. **Rejection flow**: Allow driver/pump owner to reject delivery
6. **Automated ETA**: GPS-based arrival predictions
7. **Delivery signatures**: Digital signatures from pump owner

---

**Commits**:
- `6ec2996` - Implement complete fuel request workflow with delivery confirmations
- `356e0cd` - Fix TypeScript error: keep 'dispatched' status for backward compatibility
