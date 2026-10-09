import { requireEmployeeSession } from "@/lib/employee/session";
import { AttendantHistoryClient } from "./client";

export default async function AttendantHistoryPage() {
  const session = await requireEmployeeSession();

  if (session.role !== "pump-attendant") {
    throw new Error("Access denied: pump-attendant role required");
  }

  return <AttendantHistoryClient session={session} />;
}
