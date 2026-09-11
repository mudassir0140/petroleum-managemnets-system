"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { CalendarIcon, ChartBarIcon, DocumentIcon, DownloadIcon, TrendingUpIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { PUMPS } from "@/lib/dashboard/data/pumps";
import {
  DAILY_SALES,
  MONTHLY_SALES,
  SALES_REPORT_TYPES,
  SALES_REPORTS,
  SALES_TARGETS,
  pumpSalesTotals,
} from "@/lib/dashboard/data/sales";

const ICONS = {
  chart: ChartBarIcon,
  trending: TrendingUpIcon,
  calendar: CalendarIcon,
} as const;

const REPORT_TYPE_NAMES = SALES_REPORT_TYPES.map((r) => r.name);
const FORMATS = ["CSV", "PDF"];
const PUMP_FILTERS = PUMPS.map((p) => `Pump ${p.number}`);

function generateReport(reportId: string) {
  switch (reportId) {
    case "pump-wise-sales":
      downloadCsv("pump-wise-sales-report", pumpSalesTotals().map((t) => ({
        Pump: `Pump ${t.pumpNumber}`, Name: t.pumpName, "Litres": t.liters, "Revenue (Rs.)": t.revenue,
      })));
      break;
    case "sales-performance":
      downloadCsv("sales-performance-report", SALES_TARGETS.map((t) => ({
        Pump: `Pump ${t.pumpNumber}`, Salesperson: t.salesperson, Month: t.month,
        "Target (Rs.)": t.target, "Achieved (Rs.)": t.achieved, "Achievement %": ((t.achieved / t.target) * 100).toFixed(1),
      })));
      break;
    case "daily-sales":
      downloadCsv("daily-sales-report", DAILY_SALES.map((d) => ({
        Day: d.label, "Litres": d.liters, "Revenue (Rs.)": d.revenue,
      })));
      break;
    case "monthly-sales":
      downloadCsv("monthly-sales-report", MONTHLY_SALES.map((m) => ({
        Month: m.label, "Litres": m.liters, "Revenue (Rs.)": m.revenue,
      })));
      break;
    default:
      break;
  }
}

export default function SalesReportsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [pump, setPump] = useState("All");
  const [format, setFormat] = useState("All");

  const filtered = useMemo(() => {
    return SALES_REPORTS.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = type === "All" || r.type === type;
      const matchesPump = pump === "All" || r.pump === pump || r.pump === "All Pumps";
      const matchesFormat = format === "All" || r.format === format;
      return matchesSearch && matchesType && matchesPump && matchesFormat;
    });
  }, [search, type, pump, format]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Reports"
        description="Generate detailed sales reports or download from report history."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SALES_REPORT_TYPES.map((report) => {
          const Icon = ICONS[report.icon];
          return (
            <div key={report.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">{report.name}</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{report.description}</p>
              </div>
              <button
                type="button"
                onClick={() => generateReport(report.id)}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                <DownloadIcon className="size-3.5" />
                Generate CSV
              </button>
            </div>
          );
        })}
      </div>

      <SectionCard title="Report history" description="Detailed records, not just summaries">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search reports…" />
          <FilterSelect value={type} onChange={setType} options={REPORT_TYPE_NAMES} label="Type" />
          <FilterSelect value={pump} onChange={setPump} options={PUMP_FILTERS} label="Pump" />
          <FilterSelect value={format} onChange={setFormat} options={FORMATS} label="Format" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Report</th>
                <th className="px-5 py-3 font-medium">Date range</th>
                <th className="px-5 py-3 font-medium">Pump</th>
                <th className="px-5 py-3 font-medium">Generated by</th>
                <th className="px-5 py-3 font-medium">Format</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                      <DocumentIcon className="size-4 text-slate-400" />
                      {report.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{report.type}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{report.dateRange}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{report.pump}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{report.generatedBy}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{report.format}</td>
                  <td className="px-5 py-3">
                    <Badge>{report.status}</Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No reports match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {SALES_REPORTS.length} reports
        </p>
      </SectionCard>
    </div>
  );
}
