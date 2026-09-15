"use client";

import { AdminPumpForm } from "@/components/admin/PumpForm";
import type { Pump } from "@/lib/manager/types";

interface PumpFormWrapperProps {
  mode: "create" | "edit";
  pump?: Pump;
}

export function PumpFormWrapper({ mode, pump }: PumpFormWrapperProps) {
  const handleSuccess = () => {
    // Optional: Add success handling here if needed
  };

  return <AdminPumpForm mode={mode} pump={pump} onSuccess={handleSuccess} />;
}
