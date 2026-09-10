const STEPS = [
  {
    step: "01",
    title: "Receive",
    description: "Log inbound tanker deliveries against purchase orders and dip readings.",
  },
  {
    step: "02",
    title: "Store",
    description: "Monitor tank levels, density, and temperature across every depot.",
  },
  {
    step: "03",
    title: "Distribute",
    description: "Dispatch and track tankers with route visibility to each station.",
  },
  {
    step: "04",
    title: "Sell",
    description: "Sync pump and POS sales data for accurate daily reconciliation.",
  },
  {
    step: "05",
    title: "Reconcile",
    description: "Compare expected vs. actual volumes and flag variances automatically.",
  },
];

const STATS = [
  { value: "2.4M+", label: "Liters tracked daily" },
  { value: "38%", label: "Avg. reduction in pilferage" },
  { value: "12k+", label: "Deliveries reconciled monthly" },
  { value: "100%", label: "Audit-ready reporting" },
];

export function OperationsSection() {
  return (
    <section
      id="operations"
      className="bg-slate-50 py-20 dark:bg-slate-900/40 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Operations
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            One workflow, from terminal to till
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((item, index) => (
            <div key={item.step} className="relative">
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-bold text-amber-500">
                  {item.step}
                </span>
                <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-1/2 -right-3 z-10 hidden h-px w-6 -translate-y-1/2 bg-slate-300 lg:block dark:bg-slate-700"
                />
              )}
            </div>
          ))}
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-8 rounded-2xl border border-slate-200 bg-white p-8 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-3xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </dd>
              <dd className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
