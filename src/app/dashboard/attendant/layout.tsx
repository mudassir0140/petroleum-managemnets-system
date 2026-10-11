import { getAttendantSession } from "@/lib/attendant/session";
import { AttendantHeader } from "@/components/attendant/AttendantHeader";

export default async function AttendantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getAttendantSession();

  return (
    <div>
      <AttendantHeader />
      {children}
    </div>
  );
}
