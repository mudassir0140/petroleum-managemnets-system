export type PaymentStatus = "Paid" | "Pending" | "Overdue";

export type PumpOwnerAccount = {
  pumpId: string;
  pumpNumber: number;
  pumpName: string;
  owner: string;
  phone: string;
  email: string;
  advancePaid: number;
  remainingDue: number;
  dueDate: string;
  status: PaymentStatus;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  totalPaidYtd: number;
};

export const PUMP_OWNERS: PumpOwnerAccount[] = [
  { pumpId: "PUMP-01", pumpNumber: 1, pumpName: "Al-Rehman Filling Station", owner: "Ahmed Rehman", phone: "+92 300 111 2233", email: "ahmed.rehman@petromanage.pk", advancePaid: 800000, remainingDue: 0, dueDate: "2026-09-20", status: "Paid", lastPaymentDate: "2026-09-08", lastPaymentAmount: 3200000, totalPaidYtd: 28400000 },
  { pumpId: "PUMP-02", pumpNumber: 2, pumpName: "Chaudhry Petroleum", owner: "Imran Chaudhry", phone: "+92 300 222 3344", email: "imran.chaudhry@petromanage.pk", advancePaid: 650000, remainingDue: 320000, dueDate: "2026-09-18", status: "Pending", lastPaymentDate: "2026-08-28", lastPaymentAmount: 2870000, totalPaidYtd: 31200000 },
  { pumpId: "PUMP-03", pumpNumber: 3, pumpName: "Sunrise Fuel Station", owner: "Sana Malik", phone: "+92 300 333 4455", email: "sana.malik@petromanage.pk", advancePaid: 400000, remainingDue: 610000, dueDate: "2026-09-05", status: "Overdue", lastPaymentDate: "2026-08-15", lastPaymentAmount: 1980000, totalPaidYtd: 26900000 },
  { pumpId: "PUMP-04", pumpNumber: 4, pumpName: "Highway Filling Station", owner: "Waqar Hussain", phone: "+92 300 444 5566", email: "waqar.hussain@petromanage.pk", advancePaid: 300000, remainingDue: 250000, dueDate: "2026-09-02", status: "Overdue", lastPaymentDate: "2026-08-10", lastPaymentAmount: 1450000, totalPaidYtd: 19300000 },
  { pumpId: "PUMP-05", pumpNumber: 5, pumpName: "Malik Fuels", owner: "Malik Fuels", phone: "+92 300 555 6677", email: "contact@malikfuels.pk", advancePaid: 500000, remainingDue: 180000, dueDate: "2026-09-15", status: "Pending", lastPaymentDate: "2026-09-01", lastPaymentAmount: 2760000, totalPaidYtd: 27300000 },
  { pumpId: "PUMP-06", pumpNumber: 6, pumpName: "Gulshan Petroleum", owner: "Bilal Ahmed", phone: "+92 300 666 7788", email: "bilal.ahmed@petromanage.pk", advancePaid: 200000, remainingDue: 0, dueDate: "2026-09-25", status: "Paid", lastPaymentDate: "2026-09-07", lastPaymentAmount: 3410000, totalPaidYtd: 33500000 },
];

export type PaymentTransaction = {
  id: string;
  owner: string;
  pumpName: string;
  amount: number;
  date: string;
  method: "Bank Transfer" | "Cheque" | "Cash";
  status: "Completed" | "Processing" | "Failed";
};

export const PAYMENT_TRANSACTIONS: PaymentTransaction[] = [
  { id: "PAY-5501", owner: "Ahmed Rehman", pumpName: "Al-Rehman Filling Station", amount: 3200000, date: "2026-09-08", method: "Bank Transfer", status: "Completed" },
  { id: "PAY-5498", owner: "Bilal Ahmed", pumpName: "Gulshan Petroleum", amount: 3410000, date: "2026-09-07", method: "Bank Transfer", status: "Completed" },
  { id: "PAY-5490", owner: "Malik Fuels", pumpName: "Malik Fuels", amount: 2760000, date: "2026-09-01", method: "Cheque", status: "Completed" },
  { id: "PAY-5482", owner: "Imran Chaudhry", pumpName: "Chaudhry Petroleum", amount: 2870000, date: "2026-08-28", method: "Bank Transfer", status: "Completed" },
  { id: "PAY-5470", owner: "Waqar Hussain", pumpName: "Highway Filling Station", amount: 1450000, date: "2026-08-10", method: "Cash", status: "Completed" },
  { id: "PAY-5463", owner: "Sana Malik", pumpName: "Sunrise Fuel Station", amount: 1980000, date: "2026-08-15", method: "Bank Transfer", status: "Completed" },
  { id: "PAY-5510", owner: "Sana Malik", pumpName: "Sunrise Fuel Station", amount: 610000, date: "2026-09-10", method: "Bank Transfer", status: "Processing" },
  { id: "PAY-5511", owner: "Waqar Hussain", pumpName: "Highway Filling Station", amount: 250000, date: "2026-09-10", method: "Cheque", status: "Failed" },
];
