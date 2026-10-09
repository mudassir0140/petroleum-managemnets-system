import { PageHeader } from "@/components/ui/PageHeader";
import { ReportsExplorer } from "@/components/dashboard/ReportsExplorer";
import { BackButton } from "@/components/dashboard/BackButton";
import { getSession } from "@/lib/session";
import { getPaymentSummary, getPump, getSalesHistory } from "@/lib/demo-data";
import { simulateLatency } from "@/lib/utils";

export default async function ReportsPage() {
  await simulateLatency();
  const session = await getSession();
  const pump = getPump(session.pumpId);
  const history = await getSalesHistory(session.pumpId, 30);
  const payments = getPaymentSummary(session.pumpId);

  return (
    <div>
      <BackButton />
      <PageHeader title="Reports" description="Generate, print or download sales and payment reports for your pump." />
      <ReportsExplorer history={history} payments={payments} pump={pump} />
    </div>
  );
}
