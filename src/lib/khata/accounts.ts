import { type ObjectId } from "mongodb";
import { loadAccountLedgers } from "./monthly";
import { listTransactions, type TransactionRow } from "./transactions";
import { toPaisa, fromPaisa } from "./ledger";
import { PAYMENT_METHODS, totalsByMethod, type PaymentMethod } from "./payments";

// The overall, monthly, bank and wallet accounts of one pump, all computed from the same records.
type Totals = Record<PaymentMethod, { confirmed: number; pending: number; bounced: number }>;

function paymentRecords(rows: TransactionRow[]) {
  return rows
    .filter((r) => r.kind === "payment")
    .map((r) => ({ method: r.method, status: r.status === "fuel" ? "confirmed" : r.status, amount: r.amount + r.advance }));
}

function combined(totals: Totals) {
  let confirmed = 0;
  let pending = 0;
  for (const m of PAYMENT_METHODS) {
    confirmed += toPaisa(totals[m].confirmed);
    pending += toPaisa(totals[m].pending);
  }
  return { confirmed: fromPaisa(confirmed), pending: fromPaisa(pending) };
}

export async function accountsSummary(pumpId: ObjectId, now: Date, month: string) {
  const ledgers = await loadAccountLedgers(pumpId, now);
  const rows = await listTransactions(pumpId, now);
  const monthRows = rows.filter((r) => r.date.slice(0, 7) === month);
  const payments = paymentRecords(rows);
  const monthPayments = paymentRecords(monthRows);

  // Dues and balances, across every account, for the month and overall.
  let opening = 0;
  let fuel = 0;
  let allocated = 0;
  let credit = 0;
  let closing = 0;
  for (const ledger of ledgers) {
    const row = ledger.rows.find((r) => r.month === month);
    if (row) {
      opening += toPaisa(row.opening);
      fuel += toPaisa(row.fuel);
      allocated += toPaisa(row.payments);
      credit += toPaisa(row.credit);
      closing += toPaisa(row.closing);
    }
  }
  let gross = 0;
  let netCredit = 0;
  for (const ledger of ledgers) {
    gross += toPaisa(ledger.breakdown.grossOutstanding);
    netCredit += toPaisa(ledger.breakdown.unallocatedCredit);
  }

  // Daily totals for the month, by method.
  const days = [...new Set(monthRows.filter((r) => r.kind === "payment").map((r) => r.date))].sort();
  const daily = days.map((date) => ({
    date,
    totals: totalsByMethod(paymentRecords(monthRows.filter((r) => r.date === date))),
  }));

  // Bank accounts and wallet providers: money received per account, from the transactions themselves.
  const accountsOf = (method: "bank-transfer" | "mobile-wallet", keyOf: (r: TransactionRow) => string) => {
    const groups = new Map<string, TransactionRow[]>();
    for (const r of rows.filter((x) => x.method === method && x.kind === "payment")) {
      const key = keyOf(r) || "Not recorded";
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    return [...groups.entries()]
      .map(([name, list]) => {
        const records = paymentRecords(list);
        const totals = totalsByMethod(records)[method];
        const thisMonth = paymentRecords(list.filter((r) => r.date.slice(0, 7) === month));
        return {
          name,
          confirmed: totals.confirmed,
          pending: totals.pending,
          bounced: totals.bounced,
          monthConfirmed: totalsByMethod(thisMonth)[method].confirmed,
          count: list.length,
        };
      })
      .sort((a, b) => b.confirmed - a.confirmed);
  };

  return {
    month,
    overall: { totals: totalsByMethod(payments), ...combined(totalsByMethod(payments)) },
    monthly: {
      totals: totalsByMethod(monthPayments),
      ...combined(totalsByMethod(monthPayments)),
      opening: fromPaisa(opening),
      fuel: fromPaisa(fuel),
      allocated: fromPaisa(allocated),
      credit: fromPaisa(credit),
      closing: fromPaisa(closing),
    },
    outstanding: { gross: fromPaisa(gross), credit: fromPaisa(netCredit) },
    daily,
    bankAccounts: accountsOf("bank-transfer", (r) => r.bankAccount),
    walletProviders: accountsOf("mobile-wallet", (r) => r.walletProvider),
  };
}
