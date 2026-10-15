"use server";

import { redirect } from "next/navigation";
import { endSession } from "@/lib/auth/logout";

// Form action behind every "Sign out" / "Logout" button. All roles use this one.
export async function logoutAction(): Promise<void> {
  redirect(await endSession());
}
