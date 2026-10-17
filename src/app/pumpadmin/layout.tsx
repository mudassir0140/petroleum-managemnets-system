import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { DashboardNotification } from "@/components/dashboard/Header";
import { getSession } from "@/lib/session";
import { pumpOwnerLogout } from "@/lib/pump-owner/actions";
import { getIncomingTankers, getPaymentSummary, getPump, getStockSnapshots } from "@/lib/demo-data";
import { formatDateTime, formatLitres, titleCase } from "@/lib/format";
import { toObjectId } from "@/lib/khata/ids";
import { getPumpNotifications } from "@/lib/supplier/service";
import { markPumpAdminNotificationsRead } from "@/lib/supplier/pump-notification-actions";
import { getNotifications } from "@/lib/db/notification-service";
import type { Notification } from "@/lib/db/models";

// This whole section is a per-user, real-time account dashboard — session
// data, live stock/tanker/price state must be read fresh on every request,
// never served from a static build-time snapshot.
export const dynamic = "force-dynamic";

const SUPPLIER_UPDATE_TONE: Record<string, DashboardNotification["tone"]> = {
  accepted: "good",
  payment: "good",
  delivered: "brand",
  rejected: "critical",
};

// Supplier updates for this pump (request accepted or rejected, delivered, payments), newest first.
async function buildSupplierUpdates(pumpId: string): Promise<DashboardNotification[]> {
  const id = toObjectId(pumpId);
  if (!id) return [];
  const items = await getPumpNotifications(id);
  return items.map((n) => ({
    id: `supplier-${n._id}`,
    title: n.title,
    message: n.message,
    tone: SUPPLIER_UPDATE_TONE[n.type] ?? "brand",
    createdAt: n.createdAt,
    unread: !n.readAt,
  }));
}

const ORDER_UPDATE_TONE: Record<Notification["type"], DashboardNotification["tone"]> = {
  "delivery-assigned": "brand",
  "delivery-en-route": "brand",
  "delivery-arrived": "warning",
  "delivery-completed": "good",
};

// Fuel order updates for this pump (dispatched, on the way, arrived, completed), newest first.
// Orders this pump placed are stored with the pump id as the recipient.
async function buildOrderUpdates(pumpId: string): Promise<DashboardNotification[]> {
  const items = await getNotifications(pumpId, "pump-owner", 30);
  return items.map((n) => ({
    id: `order-${n._id?.toString()}`,
    title: n.title,
    message: n.message,
    tone: ORDER_UPDATE_TONE[n.type],
    createdAt: n.createdAt.toISOString(),
    unread: !n.read,
  }));
}

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
  const [supplierUpdates, orderUpdates] = await Promise.all([buildSupplierUpdates(session.pumpId), buildOrderUpdates(session.pumpId)]);
  const updates = [...supplierUpdates, ...orderUpdates].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const notifications = [...updates, ...buildNotifications(session.pumpId)];

  return (
    <DashboardShell
      session={session}
      pump={pump}
      notifications={notifications}
      logoutAction={pumpOwnerLogout}
      markNotificationsReadAction={markPumpAdminNotificationsRead}
      hideSidebar
    >
      {children}
    </DashboardShell>
  );
}
