import {
  ChartBarIcon,
  FactoryIcon,
  GaugeIcon,
  ShieldCheckIcon,
  TruckIcon,
  UsersIcon,
} from "@/components/icons";

const FEATURES = [
  {
    icon: GaugeIcon,
    title: "Tank & inventory monitoring",
    description:
      "Track live volumes, temperature, and water-cut across every tank and terminal with automated low-stock alerts.",
  },
  {
    icon: TruckIcon,
    title: "Distribution & logistics",
    description:
      "Plan loading schedules, dispatch tankers, and track deliveries from depot to station in real time.",
  },
  {
    icon: FactoryIcon,
    title: "Station & pump sales",
    description:
      "Reconcile pump readings against tank drops and point-of-sale transactions to catch shrinkage instantly.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Safety & compliance",
    description:
      "Stay ahead of HSE audits with digital checklists, leak-detection logs, and regulatory reporting built in.",
  },
  {
    icon: ChartBarIcon,
    title: "Analytics & forecasting",
    description:
      "Forecast demand, spot margin erosion, and benchmark stations with dashboards built for fuel operators.",
  },
  {
    icon: UsersIcon,
    title: "Role-based access",
    description:
      "Give administrators, depot managers, operators, and auditors exactly the visibility their role requires.",
  },
];

export function FeaturesSection() {
  return (
    <section id="modules" className="bg-white py-20 dark:bg-slate-950 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Modules
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Everything your fuel operation needs
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            One platform to connect storage, transport, retail, and
            compliance teams — purpose-built for the petroleum industry.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-slate-200 p-6 transition hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5 dark:border-slate-800 dark:hover:border-amber-500/40"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-slate-900 text-amber-400 dark:bg-amber-500/10 dark:text-amber-400">
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
