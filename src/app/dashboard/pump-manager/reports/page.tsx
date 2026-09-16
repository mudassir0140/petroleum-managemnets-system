// @ts-nocheck
"use client";

import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { tankPercent } from "@/lib/dashboard/data/fuel-stock";
import { managerPump, managerStaff, managerTanks } from "@/lib/dashboard/data/pump-manager-portal";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import { formatCurrency, formatLiters } from "@/lib/dashboard/format";

export default function PumpManagerReportsPage() {
  const pump = managerPump();
  const tanks = managerTanks();
  const staff = managerStaff();

  if (!pump) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Daily sales, stock and attendance reports for your assigned pump." />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Your pump information is not yet available. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Daily sales, stock and attendance reports for your assigned pump." />

      <SectionCard
        title="Today's sales by fuel"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv(
                `${pump.id}-sales-report`,
                pump.todaySales.map((s) => ({
                  Fuel: FUEL_TYPE_LABELS[s.fuelType],
                  Liters: s.liters,
                  "Revenue (Rs.)": s.revenue,
                })),
              )
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Liters</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {pump.todaySales.map((sale) => (
                <tr key={sale.fuelType} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {FUEL_TYPE_LABELS[sale.fuelType]}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(sale.liters)}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {formatCurrency(sale.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Fuel stock snapshot"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv(
                `${pump.id}-stock-report`,
                tanks.map((t) => ({
                  Fuel: FUEL_TYPE_LABELS[t.fuelType],
                  "Current (L)": t.current,
                  "Capacity (L)": t.capacity,
                  "Filled (%)": tankPercent(t),
                })),
              )
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Current</th>
                <th className="px-5 py-3 font-medium">Capacity</th>
                <th className="px-5 py-3 font-medium">Filled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {tanks.map((tank) => (
                <tr key={tank.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[tank.fuelType]}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(tank.current)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(tank.capacity)}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{tankPercent(tank)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Today's staff attendance"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv(
                `${pump.id}-attendance-report`,
                staff.map((e) => ({
                  Employee: e.name,
                  Role: e.title,
                  Shift: e.shift,
                  Status: e.week[e.week.length - 1] === "P" ? "Present" : e.week[e.week.length - 1] === "A" ? "Absent" : "Leave",
                })),
              )
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Shift</th>
                <th className="px-5 py-3 font-medium">Today</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {staff.map((employee) => {
                const today = employee.week[employee.week.length - 1];
                return (
                  <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{employee.name}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{employee.title}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{employee.shift}</td>
                    <td className="px-5 py-3">
                      <Badge>{today === "P" ? "Present" : today === "A" ? "Absent" : "Leave"}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
