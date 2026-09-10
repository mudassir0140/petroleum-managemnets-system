"use client";

import { useState } from "react";

export type AlertSeverity = "critical" | "warning" | "info";

export type OperationalAlert = {
  id: string;
  title: string;
  severity: AlertSeverity;
};

const ALERTS_SEED: OperationalAlert[] = [
  { id: "alert-1", title: "Victoria Island PMS tank critically low", severity: "critical" },
  { id: "alert-2", title: "3 pump owner payments overdue", severity: "warning" },
  { id: "alert-3", title: "Pump 3 (Lekki Station) needs calibration", severity: "warning" },
];

export function useAlerts() {
  const [alerts] = useState<OperationalAlert[]>(ALERTS_SEED);
  return { alerts };
}
