"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  IconCheck,
  IconX,
  IconPlus,
  IconSearch,
  IconTrendingUp,
  IconDroplet,
} from "@/components/icons";

interface PumpRequest {
  _id: string;
  senderId?: string;
  senderName?: string;
  receiverId?: string;
  receiverName?: string;
  status: string;
  createdAt: string;
}

interface FuelRequest extends PumpRequest {
  fuelType: string;
  litres: number;
  note: string;
}

interface ConnectedPump {
  _id: string;
  name: string;
}

export default function PumpRequestsPage() {
  const [pumpRequests, setPumpRequests] = useState({
    received: [] as PumpRequest[],
    sent: [] as PumpRequest[],
    connected: [] as ConnectedPump[],
  });
  const [fuelRequests, setFuelRequests] = useState({
    received: [] as FuelRequest[],
    sent: [] as FuelRequest[],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"requests" | "fuel" | "ledger">(
    "requests"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSendRequest, setShowSendRequest] = useState(false);
  const [sendFuel, setSendFuel] = useState({
    receiverId: "",
    fuelType: "petrol",
    litres: "",
    note: "",
  });

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRequests() {
    try {
      setLoading(true);
      const [pumpRes, fuelRes] = await Promise.all([
        fetch("/api/pumpadmin/pump-requests"),
        fetch("/api/pumpadmin/fuel-requests"),
      ]);

      if (pumpRes.ok) {
        setPumpRequests(await pumpRes.json());
      }
      if (fuelRes.ok) {
        setFuelRequests(await fuelRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRespondToRequest(
    requestId: string,
    status: "accepted" | "rejected"
  ) {
    try {
      const response = await fetch("/api/pumpadmin/pump-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respond",
          requestId,
          status,
        }),
      });

      if (response.ok) {
        await fetchRequests();
      }
    } catch (error) {
      console.error("Failed to respond to request:", error);
    }
  }

  async function handleSendRequest(receiverId: string) {
    try {
      const response = await fetch("/api/pumpadmin/pump-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          receiverId,
        }),
      });

      if (response.ok) {
        setShowSendRequest(false);
        setSearchQuery("");
        await fetchRequests();
      }
    } catch (error) {
      console.error("Failed to send request:", error);
    }
  }

  async function handleSendFuelRequest() {
    if (!sendFuel.receiverId) return;

    try {
      const response = await fetch("/api/pumpadmin/fuel-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          receiverId: sendFuel.receiverId,
          fuelType: sendFuel.fuelType,
          litres: sendFuel.litres,
          note: sendFuel.note,
        }),
      });

      if (response.ok) {
        setSendFuel({
          receiverId: "",
          fuelType: "petrol",
          litres: "",
          note: "",
        });
        await fetchRequests();
      }
    } catch (error) {
      console.error("Failed to send fuel request:", error);
    }
  }

  async function handleRespondToFuelRequest(
    requestId: string,
    status: string
  ) {
    try {
      const response = await fetch("/api/pumpadmin/fuel-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respond",
          requestId,
          status,
        }),
      });

      if (response.ok) {
        await fetchRequests();
      }
    } catch (error) {
      console.error("Failed to respond to fuel request:", error);
    }
  }

  return (
    <div>
      <PageHeader
        title="Pump Requests / پمپ ریکوئسٹس"
        description="Connect with other pumps and manage fuel requests."
      />

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b border-border-subtle">
        {["requests", "fuel", "ledger"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-3 text-sm font-medium transition ${
              activeTab === tab
                ? "border-b-2 border-brand-500 text-brand-500"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            {tab === "requests" && "Friend Requests"}
            {tab === "fuel" && "Fuel Requests"}
            {tab === "ledger" && "Ledger"}
          </button>
        ))}
      </div>

      {/* Friend Requests */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {/* Connected Pumps */}
          <Card>
            <CardHeader
              title="Connected Pumps / منسلک پمپ"
              subtitle={`${pumpRequests.connected.length} pumps`}
            />
            <div className="p-5 space-y-2">
              {pumpRequests.connected.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No connected pumps yet
                </p>
              ) : (
                pumpRequests.connected.map((pump) => (
                  <div
                    key={pump._id}
                    className="flex items-center justify-between p-3 bg-surface-2 rounded-lg"
                  >
                    <p className="text-sm font-medium text-ink-primary">
                      {pump.name}
                    </p>
                    <button
                      onClick={() =>
                        setSendFuel({ ...sendFuel, receiverId: pump._id })
                      }
                      className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                    >
                      Send Fuel Request
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Received Requests */}
          <Card>
            <CardHeader
              title="Received Requests"
              subtitle={`${pumpRequests.received.length} pending`}
            />
            <div className="divide-y divide-border-subtle">
              {pumpRequests.received.map((req) => (
                <div key={req._id} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink-primary">
                      {req.senderName}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleRespondToRequest(req._id, "accepted")
                      }
                      className="rounded-lg bg-green-500 p-2 text-white hover:bg-green-600"
                    >
                      <IconCheck size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleRespondToRequest(req._id, "rejected")
                      }
                      className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600"
                    >
                      <IconX size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Sent Requests */}
          <Card>
            <CardHeader
              title="Sent Requests"
              subtitle={`${pumpRequests.sent.length} total`}
            />
            <div className="divide-y divide-border-subtle">
              {pumpRequests.sent.map((req) => (
                <div key={req._id} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink-primary">
                      {req.receiverName}
                    </p>
                    <p className="text-xs text-ink-muted capitalize">
                      {req.status}
                    </p>
                  </div>
                  <p className="text-xs text-ink-muted">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Send New Request */}
          {showSendRequest && (
            <Card>
              <CardHeader title="Send Friend Request" />
              <div className="p-5 space-y-3">
                <input
                  type="text"
                  placeholder="Search pump name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendRequest(searchQuery)}
                    disabled={!searchQuery}
                    className="flex-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    Send Request
                  </button>
                  <button
                    onClick={() => setShowSendRequest(false)}
                    className="flex-1 rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-ink-primary hover:bg-surface-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          )}

          {!showSendRequest && (
            <button
              onClick={() => setShowSendRequest(true)}
              className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600"
            >
              <IconPlus size={16} className="inline mr-2" />
              Send Friend Request
            </button>
          )}
        </div>
      )}

      {/* Fuel Requests */}
      {activeTab === "fuel" && (
        <div className="space-y-6">
          {/* Send Fuel Request Modal */}
          {sendFuel.receiverId && (
            <Card>
              <CardHeader title="Send Fuel Request" />
              <div className="p-5 space-y-3">
                <div>
                  <label className="text-xs font-medium text-ink-muted">
                    Fuel Type
                  </label>
                  <div className="mt-2 flex gap-2">
                    {["petrol", "diesel"].map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          setSendFuel({ ...sendFuel, fuelType: type })
                        }
                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${
                          sendFuel.fuelType === type
                            ? "bg-brand-500 text-white"
                            : "bg-surface-2 text-ink-primary hover:bg-surface-3"
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-muted">
                    Litres
                  </label>
                  <input
                    type="number"
                    value={sendFuel.litres}
                    onChange={(e) =>
                      setSendFuel({ ...sendFuel, litres: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-muted">
                    Note
                  </label>
                  <input
                    type="text"
                    value={sendFuel.note}
                    onChange={(e) =>
                      setSendFuel({ ...sendFuel, note: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSendFuelRequest}
                    disabled={!sendFuel.litres}
                    className="flex-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    Send Request
                  </button>
                  <button
                    onClick={() =>
                      setSendFuel({
                        receiverId: "",
                        fuelType: "petrol",
                        litres: "",
                        note: "",
                      })
                    }
                    className="flex-1 rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-ink-primary hover:bg-surface-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Received Fuel Requests */}
          <Card>
            <CardHeader
              title="Received Fuel Requests / موصول ہونے والی درخواستیں"
              subtitle={`${fuelRequests.received.length} requests`}
            />
            <div className="divide-y divide-border-subtle">
              {fuelRequests.received.length === 0 ? (
                <div className="p-5 text-sm text-ink-muted">No requests</div>
              ) : (
                fuelRequests.received.map((req) => (
                  <div key={req._id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink-primary">
                          {req.senderName}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted flex items-center gap-1">
                          <IconDroplet size={14} className="text-amber-500" />
                          {req.litres} L of {req.fuelType}
                        </p>
                        {req.note && (
                          <p className="mt-1 text-xs text-ink-muted">{req.note}</p>
                        )}
                        <p className="mt-2 text-xs text-ink-secondary capitalize">
                          Status: {req.status}
                        </p>
                      </div>
                      {req.status === "sent" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleRespondToFuelRequest(req._id, "seen")
                            }
                            className="rounded-lg bg-slate-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-600"
                          >
                            Seen
                          </button>
                          <button
                            onClick={() =>
                              handleRespondToFuelRequest(req._id, "accepted")
                            }
                            className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleRespondToFuelRequest(req._id, "rejected")
                            }
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Sent Fuel Requests */}
          <Card>
            <CardHeader
              title="Sent Fuel Requests"
              subtitle={`${fuelRequests.sent.length} requests`}
            />
            <div className="divide-y divide-border-subtle">
              {fuelRequests.sent.length === 0 ? (
                <div className="p-5 text-sm text-ink-muted">No requests</div>
              ) : (
                fuelRequests.sent.map((req) => (
                  <div key={req._id} className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink-primary">
                          {req.receiverName}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted flex items-center gap-1">
                          <IconDroplet size={14} className="text-green-500" />
                          {req.litres} L of {req.fuelType}
                        </p>
                        <p className="mt-2 text-xs text-ink-secondary capitalize">
                          Status: {req.status}
                        </p>
                      </div>
                      <p className="text-xs text-ink-muted">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Ledger Tab */}
      {activeTab === "ledger" && (
        <div className="text-center py-8 text-sm text-ink-muted">
          Ledger feature coming soon
        </div>
      )}
    </div>
  );
}
