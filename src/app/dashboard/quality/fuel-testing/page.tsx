// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CheckCircleIcon, EditIcon, FlaskIcon, PlusIcon, XCircleIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  FUEL_QUALITY_TESTS,
  QC_LOCATIONS,
  QUALITY_TEST_TYPES,
  testLocationType,
  type FuelQualityTest,
  type QCLocation,
  type QualityTestResult,
  type QualityTestType,
} from "@/lib/dashboard/data/quality-control";
import { FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const RESULTS: QualityTestResult[] = ["Pass", "Fail"];
const LOCATION_TYPES = ["Depot", "Pump"];

const RESULT_TONE: Record<QualityTestResult, BadgeTone> = {
  Pass: "success",
  Fail: "danger",
};

type TestFormState = {
  location: QCLocation;
  fuelType: FuelType;
  testType: QualityTestType;
  testedValue: string;
  standardRange: string;
  result: QualityTestResult;
  testedBy: string;
  testedAt: string;
  notes: string;
};

function emptyForm(): TestFormState {
  return {
    location: QC_LOCATIONS[0],
    fuelType: "petrol",
    testType: "Density",
    testedValue: "",
    standardRange: "",
    result: "Pass",
    testedBy: "",
    testedAt: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

function formFromTest(test: FuelQualityTest): TestFormState {
  return {
    location: test.location,
    fuelType: test.fuelType,
    testType: test.testType,
    testedValue: test.testedValue,
    standardRange: test.standardRange,
    result: test.result,
    testedBy: test.testedBy,
    testedAt: test.testedAt,
    notes: test.notes,
  };
}

export default function FuelQualityTestingPage() {
  const [tests, setTests] = useState<FuelQualityTest[]>(FUEL_QUALITY_TESTS);
  const [search, setSearch] = useState("");
  const [locationTypeFilter, setLocationTypeFilter] = useState("All");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("All");
  const [resultFilter, setResultFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TestFormState>(emptyForm());

  const filtered = useMemo(() => {
    return tests.filter((t) => {
      const matchesSearch =
        t.location.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.testType.toLowerCase().includes(search.toLowerCase());
      const matchesLocationType = locationTypeFilter === "All" || testLocationType(t) === locationTypeFilter;
      const matchesFuelType = fuelTypeFilter === "All" || FUEL_TYPE_LABELS[t.fuelType] === fuelTypeFilter;
      const matchesResult = resultFilter === "All" || t.result === resultFilter;
      return matchesSearch && matchesLocationType && matchesFuelType && matchesResult;
    });
  }, [tests, search, locationTypeFilter, fuelTypeFilter, resultFilter]);

  const totalTests = tests.length;
  const passed = tests.filter((t) => t.result === "Pass").length;
  const failed = tests.filter((t) => t.result === "Fail").length;
  const passRate = totalTests === 0 ? 0 : Math.round((passed / totalTests) * 100);

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(test: FuelQualityTest) {
    setForm(formFromTest(test));
    setEditingId(test.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.testedValue.trim() || !form.testedBy.trim()) return;

    if (editingId) {
      setTests((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                location: form.location,
                fuelType: form.fuelType,
                testType: form.testType,
                testedValue: form.testedValue.trim(),
                standardRange: form.standardRange.trim(),
                result: form.result,
                testedBy: form.testedBy.trim(),
                testedAt: form.testedAt,
                notes: form.notes.trim(),
              }
            : t,
        ),
      );
    } else {
      const newTest: FuelQualityTest = {
        id: `QT-${100 + tests.length + 1}`,
        location: form.location,
        fuelType: form.fuelType,
        testType: form.testType,
        testedValue: form.testedValue.trim(),
        standardRange: form.standardRange.trim(),
        result: form.result,
        testedBy: form.testedBy.trim(),
        testedAt: form.testedAt,
        notes: form.notes.trim(),
      };
      setTests((prev) => [newTest, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel Quality Testing"
        description="Lab and field tests run at the depot and at pump stations — density, flash point, water content and more."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Log Test
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tests logged" value={String(totalTests)} icon={FlaskIcon} />
        <StatCard label="Pass rate" value={`${passRate}%`} trend={passRate >= 90 ? "up" : "down"} delta={passRate >= 90 ? "Within target" : "Below target"} />
        <StatCard label="Passed" value={String(passed)} icon={CheckCircleIcon} tone="emerald" />
        <StatCard label="Failed" value={String(failed)} icon={XCircleIcon} tone="rose" trend={failed > 0 ? "down" : "up"} delta={failed > 0 ? "Needs follow-up" : "All clear"} />
      </div>

      <SectionCard
        title="Test records"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("fuel-quality-tests", filtered.map((t) => ({
                Test: t.id,
                Location: t.location,
                "Location Type": testLocationType(t),
                "Fuel Type": FUEL_TYPE_LABELS[t.fuelType],
                "Test Type": t.testType,
                "Tested Value": t.testedValue,
                "Standard Range": t.standardRange,
                Result: t.result,
                "Tested By": t.testedBy,
                "Tested At": t.testedAt,
                Notes: t.notes,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search location, test ID or test type…" />
          <FilterSelect value={locationTypeFilter} onChange={setLocationTypeFilter} options={LOCATION_TYPES} label="Location" />
          <FilterSelect
            value={fuelTypeFilter}
            onChange={setFuelTypeFilter}
            options={FUEL_TYPES.map((f) => FUEL_TYPE_LABELS[f])}
            label="Fuel Type"
          />
          <FilterSelect value={resultFilter} onChange={setResultFilter} options={RESULTS} label="Result" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Test</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Fuel type</th>
                <th className="px-5 py-3 font-medium">Test type</th>
                <th className="px-5 py-3 font-medium">Result</th>
                <th className="px-5 py-3 font-medium">Tested by</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{t.id}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.testedAt}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700 dark:text-slate-300">{t.location}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{testLocationType(t)}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[t.fuelType]}</td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700 dark:text-slate-300">{t.testType}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.testedValue} <span className="text-slate-400 dark:text-slate-600">· std. {t.standardRange}</span>
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={RESULT_TONE[t.result]}>{t.result}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.testedBy}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      aria-label={`Edit ${t.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <EditIcon className="size-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No tests match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {tests.length} tests
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Test Record" : "Log Fuel Quality Test"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Location</label>
              <select
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value as QCLocation }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {QC_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Fuel type</label>
                <select
                  value={form.fuelType}
                  onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value as FuelType }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f}>{FUEL_TYPE_LABELS[f]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Test type</label>
                <select
                  value={form.testType}
                  onChange={(e) => setForm((f) => ({ ...f, testType: e.target.value as QualityTestType }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {QUALITY_TEST_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Tested value</label>
                <input
                  required
                  value={form.testedValue}
                  onChange={(e) => setForm((f) => ({ ...f, testedValue: e.target.value }))}
                  placeholder="e.g. 742 kg/m³"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Standard range</label>
                <input
                  value={form.standardRange}
                  onChange={(e) => setForm((f) => ({ ...f, standardRange: e.target.value }))}
                  placeholder="e.g. 720-775 kg/m³"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Result</label>
                <select
                  value={form.result}
                  onChange={(e) => setForm((f) => ({ ...f, result: e.target.value as QualityTestResult }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {RESULTS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Tested by</label>
                <input
                  required
                  value={form.testedBy}
                  onChange={(e) => setForm((f) => ({ ...f, testedBy: e.target.value }))}
                  placeholder="e.g. Sana Farooq"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Test date</label>
              <input
                required
                type="date"
                value={form.testedAt}
                onChange={(e) => setForm((f) => ({ ...f, testedAt: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional remarks"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Log Test"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
