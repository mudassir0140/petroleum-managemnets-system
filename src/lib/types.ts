export type FuelType = "petrol" | "diesel";

export type PaymentMethod = "cash" | "card";

export type Shift = "morning" | "evening" | "night";

export interface Pump {
  id: string;
  name: string;
  location: string;
  city: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  avatarColor: string;
  online: boolean;
}

export interface PumpOwnerSession {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  pumpId: string;
  role: "pump_owner";
}

export interface StockSnapshot {
  fuel: FuelType;
  capacityLitres: number;
  currentLitres: number;
  receivedLitres7d: number;
  soldLitres7d: number;
  reorderLevelLitres: number;
}

export interface StockHistoryEntry {
  id: string;
  date: string; // ISO date
  fuel: FuelType;
  type: "received" | "sold" | "adjustment";
  litres: number;
  note: string;
}

export interface ShiftSales {
  shift: Shift;
  petrolLitres: number;
  dieselLitres: number;
  revenue: number;
  cashRevenue: number;
  cardRevenue: number;
}

export interface DailySales {
  date: string; // ISO date
  petrolLitres: number;
  dieselLitres: number;
  revenue: number;
  cashRevenue: number;
  cardRevenue: number;
  shifts: ShiftSales[];
}

export type TankerStatus =
  | "scheduled"
  | "in_transit"
  | "arriving_soon"
  | "arrived"
  | "delayed";

export interface IncomingTanker {
  id: string;
  tankerNumber: string;
  driverName: string;
  driverPhone: string;
  fuel: FuelType;
  expectedLitres: number;
  expectedArrival: string; // ISO datetime
  status: TankerStatus;
  supplier: string;
}

export type AttendanceStatus = "present" | "absent" | "leave" | "late";

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  shift: Shift;
  phone: string;
  joinedOn: string; // ISO date
  photoColor: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string; // ISO date
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
}

export interface PaymentRecord {
  id: string;
  date: string; // ISO date
  amount: number;
  method: PaymentMethod | "bank_transfer";
  note: string;
  status: "completed" | "pending";
}

export interface PaymentSummary {
  totalDueThisCycle: number;
  advancePaid: number;
  remainingDue: number;
  nextDueDate: string; // ISO date
  totalPaidAllTime: number;
  history: PaymentRecord[];
}

export interface FuelPriceState {
  petrol: number;
  diesel: number;
  updatedAt: string; // ISO datetime
  petrolPrev: number;
  dieselPrev: number;
}

export type ConnectionStatus = "none" | "pending_sent" | "pending_received" | "connected";

export interface DirectoryOwner {
  ownerId: string;
  ownerName: string;
  pumpName: string;
  city: string;
  avatarColor: string;
  online: boolean;
  connectionStatus: ConnectionStatus;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  sentAt: string; // ISO datetime
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantKind: "owner" | "company";
  avatarColor: string;
  online: boolean;
}
