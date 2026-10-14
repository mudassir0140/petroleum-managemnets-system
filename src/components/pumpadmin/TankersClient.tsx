"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { IconPlus, IconTruck, IconX } from "@/components/icons";
import { formatDateTime, titleCase } from "@/lib/format";
import type { TankerBoard, TankerOrderView, TankerTruckView } from "@/lib/db/pump-tanker-service";

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  dispatched: "Dispatched",
  "on-the-way": "On the way",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const CANCELLABLE = ["pending", "accepted", "dispatched", "on-the-way"];

const STATE_LABELS: Record<TankerTruckView["state"], string> = {
  free: "Free",
  busy: "Busy",
  maintenance: "Maintenance",
  retired: "Retired",
};

function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

function formatEta(value: string | null) {
  return value ? formatDateTime(value) : "Not set";
}

// Same rule the server uses for the driver username, shown as a preview while typing.
function previewUsername(driverName: string, pumpName: string) {
  const base = driverName.trim().toLowerCase().replace(/\s+/g, "");
  const pumpPart = pumpName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  if (!base || !pumpPart) return "";
  return `${base}.${pumpPart}`.replace(/[^a-z0-9.]/g, "");
}

async function postJson(url: string, method: "POST", body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function TankersClient({ board }: { board: TankerBoard }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ driverName: "", truckNumber: "", truckType: "Long", password: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [assignTruckId, setAssignTruckId] = useState<Record<string, string>>({});
  const [assignEta, setAssignEta] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [detailTruckId, setDetailTruckId] = useState<string | null>(null);

  // Other flows (admin dispatch, deliveries being confirmed) change these records too,
  // so reload the board regularly.
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(timer);
  }, [router]);

  const freeTrucks = board.trucks.filter((t) => t.state === "free");
  const busyTrucks = board.trucks.filter((t) => t.state === "busy");
  const generatedUsername = previewUsername(form.driverName, board.pumpName);

  async function handleCreateTruck(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const data = await postJson("/api/pumpadmin/tankers", "POST", form);
      setMessage({ tone: "ok", text: `Truck saved. Driver login: ${data.username}` });
      setForm({ driverName: "", truckNumber: "", truckType: "Long", password: "" });
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Could not save truck" });
    } finally {
      setSaving(false);
    }
  }

  async function runOrderAction(key: string, payload: Record<string, unknown>, success: string) {
    setPendingAction(key);
    setMessage(null);
    try {
      await postJson("/api/pumpadmin/tankers/orders", "POST", payload);
      setMessage({ tone: "ok", text: success });
      router.refresh();
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Action failed" });
    } finally {
      setPendingAction(null);
    }
  }

  function handleAssign(orderId: string) {
    const truckId = assignTruckId[orderId];
    if (!truckId) {
      setMessage({ tone: "error", text: "Choose a free truck first" });
      return;
    }
    const eta = assignEta[orderId];
    runOrderAction(
      `assign-${orderId}`,
      {
        action: "assign",
        orderId,
        truckId,
        expectedArrival: eta ? new Date(eta).toISOString() : null,
      },
      "Truck assigned. It is now busy."
    );
  }

  return (
    <div>
      <PageHeader
        title="Tankers / ٹینکر"
        description="Trucks, driver logins and fuel deliveries for your pump"
        action={
          <button
            type="button"
            onClick={() => {
              setShowForm((open) => !open);
              setMessage(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
          >
            <IconPlus size={16} />
            Create Truck
          </button>
        }
      />

      {message && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            message.tone === "ok"
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardHeader title="New truck" subtitle="The driver logs in with the username and password below" />
          <form onSubmit={handleCreateTruck} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Truck Driver Name</label>
              <input
                type="text"
                required
                value={form.driverName}
                onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Truck Number</label>
              <input
                type="text"
                required
                value={form.truckNumber}
                onChange={(e) => setForm({ ...form, truckNumber: e.target.value })}
                placeholder="e.g. LEA-1234"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Truck Type</label>
              <select
                value={form.truckType}
                onChange={(e) => setForm({ ...form, truckType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Username (auto-generated)</label>
              <input
                type="text"
                readOnly
                value={generatedUsername || "Enter the driver name"}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Built from the driver name and {board.pumpName || "the pump name"}. A number is added if it is already taken.
              </p>
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save truck"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Truck cards */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Trucks</h2>
        {board.trucks.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-600 dark:text-slate-400">
            No trucks yet. Use Create Truck to add one.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {board.trucks.map((truck) => (
              <button
                key={truck.id}
                type="button"
                onClick={() => setDetailTruckId(truck.id)}
                className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">{truck.driverName || "No driver"}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Truck {truck.truckNumber}</p>
                  </div>
                  <StateBadge state={truck.state} />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <Field label="Truck type" value={truck.truckType ?? "-"} />
                  <Field label="Username" value={truck.username ?? "-"} />
                  <Field label="Assigned pump" value={truck.pumpName} />
                  <Field label="Current route" value={truck.route ?? "No active route"} />
                </dl>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming trucks */}
      <section className="mb-8">
        <Card>
          <CardHeader title="Upcoming trucks" subtitle="Trucks with an active trip to your pump" />
          {board.upcoming.length === 0 ? (
            <p className="p-5 text-sm text-slate-600 dark:text-slate-400">No upcoming trips.</p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {board.upcoming.map((trip) => (
                <div key={trip.id} className="grid grid-cols-1 gap-2 p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Route" value={`${trip.pickup} → ${trip.destination}`} />
                  <Field label="Current location" value="Not reported yet" />
                  <Field label="Driver / Truck" value={`${trip.driverName ?? "-"} · ${trip.truckNumber ?? "-"}`} />
                  <Field label="Expected arrival" value={formatEta(trip.expectedArrival)} />
                  <Field label="Fuel" value={`${titleCase(trip.fuelType)} · ${trip.quantityLitres} L`} />
                  <Field label="Order status" value={orderStatusLabel(trip.status)} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* New requests */}
      <section className="mb-8">
        <Card>
          <CardHeader title="New requests" subtitle="Open fuel orders for your pump that are not on a truck yet" />
          {board.newRequests.length === 0 ? (
            <p className="p-5 text-sm text-slate-600 dark:text-slate-400">No new requests.</p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {board.newRequests.map((order) => (
                <RequestRow
                  key={order.id}
                  order={order}
                  freeTrucks={freeTrucks}
                  truckId={assignTruckId[order.id] ?? ""}
                  eta={assignEta[order.id] ?? ""}
                  busy={pendingAction !== null}
                  onTruckChange={(value) => setAssignTruckId({ ...assignTruckId, [order.id]: value })}
                  onEtaChange={(value) => setAssignEta({ ...assignEta, [order.id]: value })}
                  onAssign={() => handleAssign(order.id)}
                  onAccept={() => runOrderAction(`accept-${order.id}`, { action: "accept", orderId: order.id }, "Order accepted.")}
                  onCancel={() => runOrderAction(`cancel-${order.id}`, { action: "cancel", orderId: order.id }, "Order cancelled. Its truck is free again.")}
                />
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Free and busy lists */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TruckList title="Free trucks" trucks={freeTrucks} emptyText="No free trucks." />
        <TruckList title="Busy trucks" trucks={busyTrucks} emptyText="No busy trucks." showRoute />
      </section>

      {detailTruckId && (
        <TruckDetailPanel
          truckId={detailTruckId}
          board={board}
          onClose={() => setDetailTruckId(null)}
          onChanged={() => router.refresh()}
        />
      )}
    </div>
  );
}

function StateBadge({ state }: { state: TankerTruckView["state"] }) {
  const tone =
    state === "free"
      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
      : state === "busy"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
  return <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${tone}`}>{STATE_LABELS[state]}</span>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="break-words font-medium text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}

function TruckList({
  title,
  trucks,
  emptyText,
  showRoute = false,
}: {
  title: string;
  trucks: TankerTruckView[];
  emptyText: string;
  showRoute?: boolean;
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={`${trucks.length} truck${trucks.length === 1 ? "" : "s"}`} />
      {trucks.length === 0 ? (
        <p className="p-5 text-sm text-slate-600 dark:text-slate-400">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {trucks.map((truck) => (
            <li key={truck.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-white">
                  {truck.truckNumber} · {truck.driverName || "No driver"}
                </p>
                {showRoute && truck.route && <p className="text-xs text-slate-600 dark:text-slate-400">{truck.route}</p>}
              </div>
              <IconTruck size={18} className="shrink-0 text-amber-500" />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RequestRow({
  order,
  freeTrucks,
  truckId,
  eta,
  busy,
  onTruckChange,
  onEtaChange,
  onAssign,
  onAccept,
  onCancel,
}: {
  order: TankerOrderView;
  freeTrucks: TankerTruckView[];
  truckId: string;
  eta: string;
  busy: boolean;
  onTruckChange: (value: string) => void;
  onEtaChange: (value: string) => void;
  onAssign: () => void;
  onAccept: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 p-4 text-xs">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Route" value={`${order.pickup} → ${order.destination}`} />
        <Field label="Fuel" value={`${titleCase(order.fuelType)} · ${order.quantityLitres} L`} />
        <Field label="Requested" value={formatDateTime(order.requestedAt)} />
        <Field label="Status" value={orderStatusLabel(order.status)} />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <select
          value={truckId}
          onChange={(e) => onTruckChange(e.target.value)}
          className="min-w-44 rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">{freeTrucks.length ? "Choose a free truck" : "No free trucks"}</option>
          {freeTrucks.map((truck) => (
            <option key={truck.id} value={truck.id}>
              {truck.truckNumber} · {truck.driverName}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={eta}
          onChange={(e) => onEtaChange(e.target.value)}
          aria-label="Expected arrival"
          className="rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="button"
          disabled={busy || !truckId}
          onClick={onAssign}
          className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          Assign truck
        </button>
        {order.status === "pending" && (
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
          >
            Accept
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300"
        >
          Cancel order
        </button>
      </div>
    </div>
  );
}

// Complete details for one truck: its current order, and every order it has carried for this pump.
function TruckDetailPanel({
  truckId,
  board,
  onClose,
  onChanged,
}: {
  truckId: string;
  board: TankerBoard;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<{ truck: TankerTruckView; history: TankerOrderView[] } | null>(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Reload when the board changes, so the panel never shows a stale status.
  useEffect(() => {
    let active = true;
    fetch(`/api/pumpadmin/tankers/${truckId}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load truck");
        if (active) setDetail(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load truck");
      });
    return () => {
      active = false;
    };
  }, [truckId, board]);

  async function cancelCurrentOrder(orderId: string) {
    setCancelling(true);
    setError("");
    try {
      await postJson("/api/pumpadmin/tankers/orders", "POST", { action: "cancel", orderId });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel order");
    } finally {
      setCancelling(false);
    }
  }

  const truck = detail?.truck;
  const current = truck?.currentOrder ?? null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-lg dark:bg-slate-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Truck details</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <IconX size={18} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
          {!detail && !error && <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>}

          {truck && (
            <>
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Driver" value={truck.driverName || "-"} />
                <Field label="Truck number" value={truck.truckNumber} />
                <Field label="Truck type" value={truck.truckType ?? "-"} />
                <Field label="Driver username" value={truck.username ?? "-"} />
                <Field label="Assigned pump" value={truck.pumpName} />
                <Field label="Status" value={STATE_LABELS[truck.state]} />
                <Field label="Current route" value={truck.route ?? "No active route"} />
                <Field label="Current location" value={truck.location ?? "Not reported yet"} />
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Current order</h3>
                {current ? (
                  <div className="space-y-3 rounded-lg border border-slate-200 p-4 text-xs dark:border-slate-800">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Fuel type" value={titleCase(current.fuelType)} />
                      <Field label="Quantity" value={`${current.quantityLitres} L`} />
                      <Field label="Pickup pump" value={current.pickup} />
                      <Field label="Delivery destination" value={current.destination} />
                      <Field label="Expected arrival" value={formatEta(current.expectedArrival)} />
                      <Field label="Order status" value={orderStatusLabel(current.status)} />
                    </div>
                    {CANCELLABLE.includes(current.status) && (
                      <button
                        type="button"
                        disabled={cancelling}
                        onClick={() => cancelCurrentOrder(current.id)}
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300"
                      >
                        {cancelling ? "Cancelling..." : "Cancel this order"}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">This truck has no active order.</p>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Order history</h3>
                {detail.history.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">No orders yet for this truck.</p>
                ) : (
                  <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                    {detail.history.map((order) => (
                      <div key={order.id} className="grid grid-cols-2 gap-2 p-3 text-xs sm:grid-cols-4">
                        <Field label="Requested" value={formatDateTime(order.requestedAt)} />
                        <Field label="Fuel" value={`${titleCase(order.fuelType)} · ${order.quantityLitres} L`} />
                        <Field label="Route" value={`${order.pickup} → ${order.destination}`} />
                        <Field label="Status" value={orderStatusLabel(order.status)} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
