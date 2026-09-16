// @ts-nocheck
"use client";

import { useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CheckCircleIcon, SettingsIcon } from "@/components/icons";
import {
  DEFAULT_SYSTEM_SETTINGS,
  INTEGRATIONS,
  SYSTEM_LOGS,
  type SystemSettings,
} from "@/lib/dashboard/data/system-settings";

const BACKUP_OPTIONS: SystemSettings["backupFrequency"][] = ["Daily", "Weekly", "Monthly"];

const LOG_TONE = {
  Info: "bg-sky-500",
  Warning: "bg-amber-500",
  Error: "bg-rose-500",
} as const;

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`inline-block size-4 transform rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function TechnicalSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const connectedCount = INTEGRATIONS.filter((i) => i.status === "Connected").length;
  const errorCount = INTEGRATIONS.filter((i) => i.status === "Error").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Technical Settings"
        description="System-wide configuration, integrations and recent activity."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Maintenance mode" value={settings.maintenanceMode ? "On" : "Off"} icon={SettingsIcon} />
        <StatCard label="Session timeout" value={`${settings.sessionTimeoutMinutes} min`} />
        <StatCard label="Integrations connected" value={`${connectedCount} / ${INTEGRATIONS.length}`} />
        <StatCard label="Integration errors" value={String(errorCount)} trend={errorCount > 0 ? "down" : "up"} delta={errorCount > 0 ? "Needs attention" : "All healthy"} />
      </div>

      <SectionCard title="General settings" description="Applies across every dashboard and role">
        <form className="space-y-1 p-5" onSubmit={handleSave}>
          <ToggleRow
            label="Maintenance mode"
            description="Show a maintenance banner and block new logins"
            checked={settings.maintenanceMode}
            onChange={(v) => update("maintenanceMode", v)}
          />
          <ToggleRow
            label="Require two-factor authentication"
            description="All users must verify with a second factor at login"
            checked={settings.requireTwoFactor}
            onChange={(v) => update("requireTwoFactor", v)}
          />
          <ToggleRow
            label="Email notifications"
            description="Send system alerts and reports by email"
            checked={settings.emailNotifications}
            onChange={(v) => update("emailNotifications", v)}
          />
          <ToggleRow
            label="SMS notifications"
            description="Send critical alerts by SMS"
            checked={settings.smsNotifications}
            onChange={(v) => update("smsNotifications", v)}
          />

          <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Session timeout (minutes)</label>
              <input
                type="number"
                min={5}
                max={240}
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => update("sessionTimeoutMinutes", Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Minimum password length</label>
              <input
                type="number"
                min={6}
                max={32}
                value={settings.passwordMinLength}
                onChange={(e) => update("passwordMinLength", Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Backup frequency</label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => update("backupFrequency", e.target.value as SystemSettings["backupFrequency"])}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {BACKUP_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Data retention (days)</label>
              <input
                type="number"
                min={30}
                value={settings.dataRetentionDays}
                onChange={(e) => update("dataRetentionDays", Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Timezone</label>
              <input
                value={settings.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Default currency</label>
              <input
                value={settings.defaultCurrency}
                onChange={(e) => update("defaultCurrency", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Save Settings
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircleIcon className="size-4" />
                Saved
              </span>
            )}
          </div>
        </form>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Integrations" description="Connected third-party services">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {INTEGRATIONS.map((integration) => (
              <li key={integration.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{integration.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{integration.description}</p>
                  {integration.lastSync && (
                    <p className="text-xs text-slate-400">Last sync: {integration.lastSync}</p>
                  )}
                </div>
                <Badge>{integration.status}</Badge>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Recent system activity" description="Latest system-level log entries">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {SYSTEM_LOGS.map((log) => (
              <li key={log.id} className="flex items-start gap-3 px-5 py-3">
                <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${LOG_TONE[log.level]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{log.message}</p>
                  <p className="text-xs text-slate-400">{log.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
