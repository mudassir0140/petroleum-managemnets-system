import { redirect } from "next/navigation";
import { findSignedInDestination } from "@/lib/auth/session-check";
import { LoginPageClient } from "./LoginPageClient";

export const dynamic = "force-dynamic";

// A visitor with a valid session (checked in MongoDB) goes straight to their own
// dashboard. Anyone else sees the login form.
export default async function LoginPage() {
  const destination = await findSignedInDestination();
  if (destination) redirect(destination);
  return <LoginPageClient />;
}
