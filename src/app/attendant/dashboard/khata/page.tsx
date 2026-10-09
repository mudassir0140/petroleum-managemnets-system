"use client";

import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

export default function KhataPage() {
  // Demo data - would be fetched from API
  const khataAccounts = [
    {
      id: "1",
      customerName: "Ali's General Store",
      balance: 5400,
      entries: [
        { date: "2026-10-04", amount: 2000, note: "Petrol 50L", type: "Credit" },
        { date: "2026-10-02", amount: 1500, note: "Diesel 30L", type: "Credit" },
        { date: "2026-09-30", amount: 1900, note: "Payment received", type: "Debit" },
      ],
    },
    {
      id: "2",
      customerName: "Pak Transport Co.",
      balance: 8750,
      entries: [
        { date: "2026-10-05", amount: 3000, note: "Diesel 60L", type: "Credit" },
        { date: "2026-10-03", amount: 2500, note: "Petrol 100L", type: "Credit" },
        { date: "2026-10-01", amount: 2000, note: "Payment received", type: "Debit" },
      ],
    },
  ];

  return (
    <div>
      <BackButton />
      <PageHeader
        title="Khata / کھاتہ"
        description="Customer credit accounts you handle"
      />

      <div className="space-y-6">
        {khataAccounts.map((account) => (
          <Card key={account.id}>
            <CardHeader
              title={account.customerName}
              subtitle={`Balance: Rs ${account.balance.toLocaleString()}`}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="px-4 py-3 text-left font-medium text-ink-muted">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-ink-muted">Note</th>
                    <th className="px-4 py-3 text-right font-medium text-ink-muted">Amount (Rs)</th>
                    <th className="px-4 py-3 text-center font-medium text-ink-muted">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {account.entries.map((entry, idx) => (
                    <tr key={idx} className="border-b border-border-subtle hover:bg-surface-2">
                      <td className="px-4 py-3 text-ink-primary">{entry.date}</td>
                      <td className="px-4 py-3 text-ink-primary">{entry.note}</td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        entry.type === "Credit" ? "text-blue-600" : "text-green-600"
                      }`}>
                        {entry.type === "Credit" ? "+" : "-"} {entry.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.type === "Credit"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {entry.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
