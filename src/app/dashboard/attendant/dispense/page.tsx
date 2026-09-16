// @ts-nocheck
import { getAttendantSession } from "@/lib/attendant/session";
import { DispenseFuelClient } from "./client";

export default async function DispenseFuelPage() {
  const session = await getAttendantSession();
  return <DispenseFuelClient session={session} />;
}
