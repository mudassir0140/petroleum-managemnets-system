import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { getAllPayments } from "@/lib/db/payment-service";
import { getAllPumps } from "@/lib/db/pump-service";
import { PaymentsManager } from "./payments-client";

export default async function FinancePage() {
  const [payments, pumps] = await Promise.all([getAllPayments(), getAllPumps()]);

  const now = Date.now();
  const paid = payments.filter((p) => p.status === "paid");
  const overdue = payments.filter((p) => p.status === "pending" && p.dueDate.getTime() < now);
  const pending = payments.filter((p) => p.status === "pending" && p.dueDate.getTime() >= now);
  const totalOutstanding = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (p.amountDue - p.amountPaid), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Payments"
        description="Which pumps have paid, what's pending, and what's overdue — live from MongoDB."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Paid" value={String(paid.length)} tone="emerald" />
        <StatCard label="Pending" value={String(pending.length)} tone="amber" />
        <StatCard label="Overdue" value={String(overdue.length)} tone="rose" />
        <StatCard label="Total Outstanding" value={`Rs. ${totalOutstanding.toLocaleString()}`} tone="purple" />
      </div>

      <SectionCard title="Pump Payments" description="Create a payment record per pump and mark it paid once settled.">
        <div className="p-6">
          <PaymentsManager
            initialPayments={payments.map((p) => ({
              _id: p._id!.toString(),
              pumpId: p.pumpId.toString(),
              pumpName: p.pumpName,
              amountDue: p.amountDue,
              amountPaid: p.amountPaid,
              status: p.status,
              dueDate: p.dueDate.toISOString(),
              paidAt: p.paidAt?.toISOString(),
              notes: p.notes,
            }))}
            pumps={pumps.map((p) => ({ id: p._id!.toString(), name: p.name }))}
          />
        </div>
      </SectionCard>
    </div>
  );
}
