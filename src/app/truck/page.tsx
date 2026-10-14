import { redirect } from "next/navigation";
import { getTruckAccount } from "@/lib/truck/session";
import { TruckDriverView } from "@/components/truck/TruckDriverView";

export const dynamic = "force-dynamic";

// Driver dashboard. Signed-out visitors go to the login page.
export default async function TruckDriverPage() {
  const account = await getTruckAccount();
  if (!account) redirect("/auth/login");

  return <TruckDriverView driverName={String(account.driverName ?? "")} truckNumber={String(account.registrationNumber ?? "")} />;
}
