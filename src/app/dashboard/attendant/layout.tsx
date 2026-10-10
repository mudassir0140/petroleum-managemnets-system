import { AttendantHeader } from "@/components/attendant/AttendantHeader";

export default function AttendantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <AttendantHeader />
      {children}
    </div>
  );
}
