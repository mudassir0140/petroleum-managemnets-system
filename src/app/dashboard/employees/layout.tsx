import type { ReactNode } from "react";
import { EmployeesSidebar } from "@/components/employees/employees-sidebar";

export const dynamic = "force-dynamic";

export default async function EmployeesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <EmployeesSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:pl-64">
        <main className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
