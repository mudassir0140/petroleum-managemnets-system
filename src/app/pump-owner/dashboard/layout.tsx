import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { DashboardNotification } from "@/components/dashboard/Header";
import { getSession } from "@/lib/session";
import { pumpOwnerLogout } from "@/lib/pump-owner/actions";
import { getIncomingTankers, getPaymentSummary, getPump, getStockSnapshots } from "@/lib/demo-data";
import { formatDateTime, formatLitres, titleCase } from "@/lib/format";

// This whole section is a per-user, real-time account dashboard — session
// data, live stock/tanker/price state must be read fresh on every request,
// never served from a static build-time snapshot.
export const dynamic = "force-dynamic";

function buildNotifications(pumpId: string): DashboardNotification[] {
  const notifications: DashboardNotification[] = [];

  for (const stock of getStockSnapshots(pumpId)) {
    if (stock.currentLitres <= stock.reorderLevelLitres) {
      notifications.push({
        id: `low-${stock.fuel}`,
        title: `Low ${titleCase(stock.fuel)} stock`,
        message: `Only ${formatLitres(stock.currentLitres)} left — below the ${formatLitres(stock.reorderLevelLitres)} reorder level.`,
        tone: "critical",
      });
    }
  }

  const nextTanker = getIncomingTankers(pumpId)
    .filter((t) => new Date(t.expectedArrival).getTime() > Date.now())
    .sort((a, b) => new Date(a.expectedArrival).getTime() - new Date(b.expectedArrival).getTime())[0];
  if (nextTanker) {
    notifications.push({
      id: `tanker-${nextTanker.id}`,
      title: "Tanker arriving",
      message: `${nextTanker.tankerNumber} (${titleCase(nextTanker.fuel)}) expected ${formatDateTime(nextTanker.expectedArrival)}.`,
      tone: "brand",
    });
  }

  const payments = getPaymentSummary(pumpId);
  const daysToDue = Math.round((new Date(payments.nextDueDate).getTime() - Date.now()) / 86400000);
  if (payments.remainingDue > 0 && daysToDue <= 5) {
    notifications.push({
      id: "payment-due",
      title: "Payment due soon",
      message: `Remaining balance is due to the Company in ${daysToDue} day${daysToDue === 1 ? "" : "s"}.`,
      tone: "warning",
    });
  }

  return notifications;
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const pump = getPump(session.pumpId);
  const notifications = buildNotifications(session.pumpId);

  return (
    <DashboardShell session={session} pump={pump} notifications={notifications} logoutAction={pumpOwnerLogout}>
      {children}
    </DashboardShell>
  );
}
