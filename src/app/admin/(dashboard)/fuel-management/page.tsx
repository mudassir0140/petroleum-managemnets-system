import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { getStockOverview, getTodaySalesSummary } from "@/lib/db/fuel-overview-service";
import { getAllOrders } from "@/lib/db/order-service";
import { getAllPumps } from "@/lib/db/pump-service";
import { OrdersManager } from "./orders-client";

function formatLitres(n: number): string {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} L`;
}

export default async function FuelManagementPage() {
  const [stock, sales, orders, pumps] = await Promise.all([
    getStockOverview(),
    getTodaySalesSummary(),
    getAllOrders(),
    getAllPumps(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel & Orders Overview"
        description="Network-wide stock, today's sales, and fuel resupply orders — live from MongoDB."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Petrol in stock"
          value={formatLitres(stock.totalPetrolStock)}
          hint={`of ${formatLitres(stock.totalPetrolCapacity)} capacity`}
          tone="amber"
        />
        <StatCard
          label="Diesel in stock"
          value={formatLitres(stock.totalDieselStock)}
          hint={`of ${formatLitres(stock.totalDieselCapacity)} capacity`}
          tone="sky"
        />
        <StatCard
          label="Petrol sold today"
          value={formatLitres(sales.petrolLitres)}
          hint={`${sales.pumpsReporting} pump(s) reporting`}
          tone="emerald"
        />
        <StatCard
          label="Diesel sold today"
          value={formatLitres(sales.dieselLitres)}
          hint={`Revenue today: Rs. ${sales.revenue.toLocaleString()}`}
          tone="purple"
        />
      </div>

      <SectionCard title="Stock by Pump" description="Current fuel levels across every pump in the network.">
        <div className="overflow-x-auto">
          {stock.perPump.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-600 dark:text-slate-400">
              No pumps created yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Pump</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">City</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Petrol</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Diesel</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {stock.perPump.map((p) => (
                  <tr key={p.pumpId}>
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{p.city}</td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                      {formatLitres(p.petrolStock)} / {formatLitres(p.petrolCapacity)}
                    </td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                      {formatLitres(p.dieselStock)} / {formatLitres(p.dieselCapacity)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Fuel Orders"
        description="Which pump ordered how much fuel, and its dispatch status."
      >
        <div className="p-6">
          <OrdersManager
            initialOrders={orders.map((o) => ({
              _id: o._id!.toString(),
              pumpId: o.pumpId.toString(),
              pumpName: o.pumpName,
              fuelType: o.fuelType,
              quantityLitres: o.quantityLitres,
              status: o.status,
              notes: o.notes,
              requestedAt: o.requestedAt.toISOString(),
              dispatchedAt: o.dispatchedAt?.toISOString(),
              deliveredAt: o.deliveredAt?.toISOString(),
            }))}
            pumps={pumps.map((p) => ({ id: p._id!.toString(), name: p.name }))}
          />
        </div>
      </SectionCard>
    </div>
  );
}
