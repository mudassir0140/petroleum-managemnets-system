// Types for the Company Manager Dashboard (src/app/manager, src/lib/data,
// src/lib/store, src/components/ops) — kept separate from src/lib/types.ts,
// which serves the self-service portals (Attendant, Cashier, Pump Owner,
// Admin, Security Guard). Some names (Pump, TankerStatus, ChatMessage,
// FuelPriceState) exist in both with different shapes, so importing the
// wrong one is a type error, not a coincidence.
export type PumpStatus = "open" | "low-stock" | "closed";

export type FuelKind = "petrol" | "diesel" | "premium";

export interface PumpStock {
  fuel: FuelKind;
  label: string;
  stockLiters: number;
  capacityLiters: number;
}

export interface Pump {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  status: PumpStatus;
  stocks: PumpStock[];
  todaySalesValue: number;
  todaySalesLiters: number;
  lastDelivery: string;
  staffOnDuty: string[];
}

export type EmployeeRole =
  | "Pump Supervisor"
  | "Pump Attendant"
  | "Cashier"
  | "Tanker Driver"
  | "Field Officer";

export type AttendanceStatus = "present" | "absent" | "on-leave";
export type ShiftName = "Morning" | "Evening" | "Night";

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  pumpId: string | null;
  pumpName: string | null;
  shift: ShiftName;
  attendance: AttendanceStatus;
  phone: string;
  joinDate: string;
  avatarColor: string;
}

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  requestedOn: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
  status: "available" | "on-trip" | "off-duty";
}

export type TankerStatus = "available" | "in-transit" | "maintenance";

export interface Tanker {
  id: string;
  regNumber: string;
  capacityLiters: number;
  status: TankerStatus;
}

export type TripStatus =
  | "scheduled"
  | "departed"
  | "in-transit"
  | "delayed"
  | "arrived"
  | "delivered";

export interface TankerTrip {
  id: string;
  tankerId: string;
  driverId: string;
  originDepot: string;
  destinationPumpId: string;
  product: string;
  quantityLiters: number;
  departureTime: string;
  expectedArrival: string;
  actualArrival: string | null;
  status: TripStatus;
  deliveryConfirmed: boolean;
  notes?: string;
}

export type ComplaintStatus = "open" | "in-progress" | "resolved";
export type ComplaintPriority = "low" | "medium" | "high";

export interface Complaint {
  id: string;
  pumpId: string;
  subject: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  raisedOn: string;
  resolutionNotes: string | null;
}

export type PaymentStatus = "pending" | "overdue" | "paid";

export interface PaymentFollowUp {
  id: string;
  pumpId: string;
  amountDue: number;
  dueDate: string;
  status: PaymentStatus;
  lastContact: string;
  notes: string;
}

export type TaskStatus = "todo" | "in-progress" | "verify" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface ManagerTask {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  pumpId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdOn: string;
}

export type AlertType =
  | "low-stock"
  | "delayed-tanker"
  | "payment-overdue"
  | "pending-delivery"
  | "complaint"
  | "leave-request";

export type AlertSeverity = "critical" | "warning" | "info";

export interface OperationalAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  pumpId: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: "manager" | "owner";
  text: string;
  time: string;
}

export interface ChatConversation {
  id: string;
  pumpOwnerName: string;
  pumpId: string;
  pumpName: string;
  online: boolean;
  lastSeen: string;
}

export type FuelProduct = "Petrol" | "Diesel" | "Premium / Power Petrol";

export interface FuelPrice {
  product: FuelProduct;
  pricePerLiter: number;
  change: number;
}

export interface FuelPriceState {
  prices: FuelPrice[];
  updatedAt: string;
  updatedBy: string;
}
