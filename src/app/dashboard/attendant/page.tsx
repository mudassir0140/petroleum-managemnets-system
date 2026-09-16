// @ts-nocheck
import { getAttendantSession } from "@/lib/attendant/session";
import { AttendantOverviewClient } from "./client";

export default async function AttendantOverviewPage() {
  const session = await getAttendantSession();
  return <AttendantOverviewClient session={session} />;
}
