import { getEmployeeSession, requireEmployeeSession } from "@/lib/employee/session";
import { DispenseFuelClient } from "./client";

export default async function DispenseFuelPage() {
  const session = await requireEmployeeSession();

  if (session.role !== "pump-attendant") {
    throw new Error("Access denied: pump-attendant role required");
  }

  return <DispenseFuelClient session={session} />;
}
