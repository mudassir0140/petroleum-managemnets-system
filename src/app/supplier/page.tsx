import { redirect } from "next/navigation";
import { getSupplierAccount } from "@/lib/supplier/session";
import { SupplierInbox } from "@/components/supplier/SupplierInbox";

export const dynamic = "force-dynamic";

// Supplier dashboard. Signed-out visitors go to the login page.
export default async function SupplierDashboardPage() {
  const account = await getSupplierAccount();
  if (!account) redirect("/auth/login");

  return (
    <SupplierInbox
      name={String(account.name ?? "")}
      companyName={String(account.companyName ?? "")}
      advance={Number(account.advance) || 0}
    />
  );
}
