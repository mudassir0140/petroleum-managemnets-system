// @ts-nocheck
import { getAttendantSession } from "@/lib/attendant/session";
import { AttendantHistoryClient } from "./client";

export default async function AttendantHistoryPage() {
  const session = await getAttendantSession();
  return <AttendantHistoryClient session={session} />;
}
