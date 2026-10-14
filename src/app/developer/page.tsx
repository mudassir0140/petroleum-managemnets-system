import { redirect } from "next/navigation";
import { findSignedInDestination } from "@/lib/auth/session-check";
import { AdminLoginPageClient } from "./AdminLoginPageClient";

export const dynamic = "force-dynamic";

// Same rule as /auth/login: a valid session goes to its own dashboard.
export default async function AdminLoginPage() {
  const destination = await findSignedInDestination();
  if (destination) redirect(destination);
  return <AdminLoginPageClient />;
}
