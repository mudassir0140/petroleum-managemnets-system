import { redirect } from "next/navigation";
import { getSupplierAccount } from "@/lib/supplier/session";
import { SupplierDashboard } from "@/components/supplier/SupplierDashboard";

export const dynamic = "force-dynamic";

export default async function SupplierDashboardPage() {
  const account = await getSupplierAccount();
  if (!account) redirect("/auth/login");

  return <SupplierDashboard />;
}
