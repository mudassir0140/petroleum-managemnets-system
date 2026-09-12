"use server";

import { revalidatePath } from "next/cache";
import { getCashierSession } from "@/lib/cashier/session";
import { CashierShiftError, recordTransaction, startShift, submitHandover } from "@/lib/cashier/shift-store";
import type { CashierShiftActionState } from "@/lib/cashier/auth-state";
import type { PaymentMethod } from "@/lib/types";
import type { TransactionCategory } from "@/lib/cashier/types";

const DASHBOARD_PATH = "/cashier/dashboard";

function readString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function startCashierShiftAction(): Promise<void> {
  const session = await getCashierSession();
  startShift(session.cashierId, session.pumpId, session.assignedShift);
  revalidatePath(DASHBOARD_PATH);
}

export async function recordTransactionAction(_prevState: CashierShiftActionState | undefined, formData: FormData): Promise<CashierShiftActionState> {
  const session = await getCashierSession();

  const category = readString(formData, "category") as TransactionCategory;
  const description = readString(formData, "description");
  const amount = Number(readString(formData, "amount"));
  const paymentMethod = readString(formData, "paymentMethod") as PaymentMethod;

  const validCategories: TransactionCategory[] = ["fuel", "shop", "service", "other"];
  if (!validCategories.includes(category)) {
    return { error: "Select a transaction category." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }
  if (paymentMethod !== "cash" && paymentMethod !== "card") {
    return { error: "Select a payment method." };
  }

  try {
    recordTransaction({ cashierId: session.cashierId, category, description, amount, paymentMethod });
  } catch (err) {
    if (err instanceof CashierShiftError) return { error: err.message };
    throw err;
  }

  revalidatePath(`${DASHBOARD_PATH}/collect`);
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

export async function submitHandoverAction(_prevState: CashierShiftActionState | undefined, formData: FormData): Promise<CashierShiftActionState> {
  const session = await getCashierSession();

  const cashCounted = Number(readString(formData, "cashCounted"));
  const handoverTo = readString(formData, "handoverTo");
  const notes = readString(formData, "notes");

  if (!Number.isFinite(cashCounted) || cashCounted < 0) {
    return { error: "Enter the cash amount counted in the drawer." };
  }
  if (!handoverTo.trim()) {
    return { error: "Enter who you're handing the shift over to." };
  }

  try {
    submitHandover({ cashierId: session.cashierId, cashCounted, handoverTo, notes });
  } catch (err) {
    if (err instanceof CashierShiftError) return { error: err.message };
    throw err;
  }

  revalidatePath(DASHBOARD_PATH);
  revalidatePath(`${DASHBOARD_PATH}/history`);
  return { success: true };
}
