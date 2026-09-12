"use server";

import { revalidatePath } from "next/cache";
import { getAttendantSession } from "@/lib/attendant/session";
import { ShiftError, recordSale, startShift, submitClosingReport } from "@/lib/attendant/shift-store";
import type { ShiftActionState } from "@/lib/attendant/auth-state";
import type { FuelType, PaymentMethod } from "@/lib/types";

const DASHBOARD_PATH = "/attendant/dashboard";

function readString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function startShiftAction(): Promise<void> {
  const session = await getAttendantSession();
  startShift(session.attendantId, session.pumpId, session.assignedShift);
  revalidatePath(DASHBOARD_PATH);
}

export async function recordSaleAction(_prevState: ShiftActionState | undefined, formData: FormData): Promise<ShiftActionState> {
  const session = await getAttendantSession();

  const fuel = readString(formData, "fuel") as FuelType;
  const litres = Number(readString(formData, "litres"));
  const paymentMethod = readString(formData, "paymentMethod") as PaymentMethod;

  if (fuel !== "petrol" && fuel !== "diesel") {
    return { error: "Select a fuel type." };
  }
  if (!Number.isFinite(litres) || litres <= 0) {
    return { error: "Enter a valid number of litres." };
  }
  if (paymentMethod !== "cash" && paymentMethod !== "card") {
    return { error: "Select a payment method." };
  }

  try {
    recordSale({ attendantId: session.attendantId, fuel, litres, paymentMethod });
  } catch (err) {
    if (err instanceof ShiftError) return { error: err.message };
    throw err;
  }

  revalidatePath(`${DASHBOARD_PATH}/dispense`);
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

export async function endShiftAction(_prevState: ShiftActionState | undefined, formData: FormData): Promise<ShiftActionState> {
  const session = await getAttendantSession();

  const cashCounted = Number(readString(formData, "cashCounted"));
  const notes = readString(formData, "notes");

  if (!Number.isFinite(cashCounted) || cashCounted < 0) {
    return { error: "Enter the cash amount counted in the drawer." };
  }

  try {
    submitClosingReport({ attendantId: session.attendantId, cashCounted, notes });
  } catch (err) {
    if (err instanceof ShiftError) return { error: err.message };
    throw err;
  }

  revalidatePath(DASHBOARD_PATH);
  revalidatePath(`${DASHBOARD_PATH}/history`);
  return { success: true };
}
