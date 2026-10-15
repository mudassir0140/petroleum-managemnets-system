import { redirect } from "next/navigation";
import { findAccountForRole, isAccountRole } from "@/lib/account/change-password";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export const dynamic = "force-dynamic";

// Change Password page. The role comes from the link, but the page only shows the form when that role's
// session is signed in on this browser. Otherwise it goes to the login page.
export default async function ChangePasswordPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  if (!isAccountRole(role)) redirect("/auth/login");

  const account = await findAccountForRole(role);
  if (!account) redirect("/auth/login");

  return <ChangePasswordForm role={role} />;
}
