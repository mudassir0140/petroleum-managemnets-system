import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { getAdminSession } from "@/lib/admin/session";
import { simulateLatency } from "@/lib/utils";

interface FuelPrice {
  fuel: string;
  currentPrice: number;
  previousPrice: number;
  change: string;
  trend: "up" | "down" | "stable";
}

interface StockLevel {
  pumpId: string;
  pumpName: string;
  petrol: number;
  petrolCapacity: number;
  diesel: number;
  dieselCapacity: number;
  status: "good" | "low" | "critical";
}

export default async function FuelManagementPage() {
  await simulateLatency();
  const session = await getAdminSession();

  const fuelPrices: FuelPrice[] = [
    { fuel: "Petrol", currentPrice: 289.50, previousPrice: 285.00, change: "+1.6%", trend: "up" },
    { fuel: "Diesel", currentPrice: 279.25, previousPrice: 280.00, change: "-0.3%", trend: "down" },
  ];

  const stockLevels: StockLevel[] = [
    { pumpId: "PUMP-014", pumpName: "Al-Falah Fuel Station", petrol: 4500, petrolCapacity: 5000, diesel: 3800, dieselCapacity: 5000, status: "good" },
    { pumpId: "PUMP-021", pumpName: "Shahbaz Petroleum", petrol: 2100, petrolCapacity: 5000, diesel: 1900, dieselCapacity: 5000, status: "low" },
    { pumpId: "PUMP-032", pumpName: "Margalla Fuel Point", petrol: 800, petrolCapacity: 5000, diesel: 500, dieselCapacity: 5000, status: "critical" },
  ];

  const priceColumns: Column<FuelPrice>[] = [
    { header: "Fuel Type", cell: (row) => <span className="font-medium text-ink-primary">{row.fuel}</span> },
    { header: "Current Price", cell: (row) => <span className="font-semibold text-ink-primary">PKR {row.currentPrice.toFixed(2)}</span> },
    { header: "Previous Price", cell: (row) => <span className="text-sm text-ink-secondary">PKR {row.previousPrice.toFixed(2)}</span> },
    { header: "Change", cell: (row) => <Badge tone={row.trend === "up" ? "critical" : row.trend === "down" ? "good" : "neutral"}>{row.change}</Badge> },
  ];

  const stockColumns: Column<StockLevel>[] = [
    { header: "Pump", cell: (row) => <span className="font-medium text-ink-primary">{row.pumpName}</span> },
    { header: "Petrol", cell: (row) => <span className="text-sm text-ink-secondary">{row.petrol.toLocaleString()} / {row.petrolCapacity.toLocaleString()} L</span> },
    { header: "Diesel", cell: (row) => <span className="text-sm text-ink-secondary">{row.diesel.toLocaleString()} / {row.dieselCapacity.toLocaleString()} L</span> },
    { header: "Status", cell: (row) => <Badge tone={row.status === "good" ? "good" : row.status === "low" ? "warning" : "critical"}>{row.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel & Stock Management"
        description="Monitor fuel prices, manage stock levels, and optimize inventory across all pumps."
      />

      <Card>
        <CardHeader title="Fuel Prices" subtitle="Current market prices and price changes" />
        <Table columns={priceColumns} rows={fuelPrices} rowKey={(row) => row.fuel} />
      </Card>

      <Card>
        <CardHeader title="Stock Levels" subtitle="Current inventory across all pump stations" />
        <Table columns={stockColumns} rows={stockLevels} rowKey={(row) => row.pumpId} />
      </Card>
    </div>
  );
}
