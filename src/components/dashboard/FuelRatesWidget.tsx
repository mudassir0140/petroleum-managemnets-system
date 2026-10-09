"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { IconDroplet, IconEdit, IconCheck } from "@/components/icons";
import { formatCurrency } from "@/lib/format";

interface FuelRates {
  petrolRate: number;
  dieselRate: number;
  source: string;
  manualOverride?: boolean;
}

export function FuelRatesWidget() {
  const [rates, setRates] = useState<FuelRates | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [petrol, setPetrol] = useState("");
  const [diesel, setDiesel] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  async function fetchRates() {
    try {
      const response = await fetch("/api/pumpadmin/fuel-rates");
      if (response.ok) {
        const data = await response.json();
        setRates(data);
        setPetrol(data.petrolRate.toString());
        setDiesel(data.dieselRate.toString());
      }
    } catch (error) {
      console.error("Failed to fetch fuel rates:", error);
    }
  }

  async function handleSaveRates() {
    try {
      setLoading(true);
      const response = await fetch("/api/pumpadmin/fuel-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petrolRate: parseFloat(petrol),
          dieselRate: parseFloat(diesel),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRates(data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to save fuel rates:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!rates) return null;

  return (
    <Card className="mb-6">
      <div className="flex items-start justify-between p-5">
        <div>
          <h3 className="text-lg font-semibold text-ink-primary mb-4">Today's Petroleum Rates (Pakistan)</h3>
          {!isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <IconDroplet size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Petrol (per litre)</p>
                    <p className="text-xl font-bold text-ink-primary">Rs {formatCurrency(rates.petrolRate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                    <IconDroplet size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Diesel (per litre)</p>
                    <p className="text-xl font-bold text-ink-primary">Rs {formatCurrency(rates.dieselRate)}</p>
                  </div>
                </div>
              </div>
              {rates.manualOverride && (
                <p className="text-xs text-amber-600 font-medium">Manually overridden</p>
              )}
            </div>
          ) : (
            <div className="flex gap-4">
              <div>
                <label className="text-xs text-ink-muted">Petrol</label>
                <input
                  type="number"
                  step="0.01"
                  value={petrol}
                  onChange={(e) => setPetrol(e.target.value)}
                  className="mt-1 w-32 rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted">Diesel</label>
                <input
                  type="number"
                  step="0.01"
                  value={diesel}
                  onChange={(e) => setDiesel(e.target.value)}
                  className="mt-1 w-32 rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <button
                onClick={handleSaveRates}
                disabled={loading}
                className="mt-6 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="rounded-lg p-2 text-ink-muted hover:bg-surface-3 hover:text-ink-primary"
        >
          <IconEdit size={18} />
        </button>
      </div>
    </Card>
  );
}
