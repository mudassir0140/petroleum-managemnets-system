import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { PageHeader } from "@/components/ui/PageHeader";
import { SupplierDetail } from "@/components/pump-owner/supplier/SupplierDetail";
import { getSession } from "@/lib/session";
import { getSupplierForPump, listRequestsForPumpSupplier } from "@/lib/supplier/service";

export const dynamic = "force-dynamic";

// One supplier of this pump. A supplier id from another pump gets the not-found page.
export default async function SupplierPage({ params }: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await params;
  if (!/^[a-f0-9]{24}$/i.test(supplierId)) notFound();

  const session = await getSession();
  const pumpId = new ObjectId(session.pumpId);
  const supplier = await getSupplierForPump(pumpId, new ObjectId(supplierId));
  if (!supplier) notFound();

  const requests = await listRequestsForPumpSupplier(pumpId, new ObjectId(supplierId));

  return (
    <div>
      <Link href="/pumpadmin/fuel-orders" className="mb-4 inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        ← Back to Fuel Orders / واپس
      </Link>
      <PageHeader title={supplier.companyName || supplier.name} description="Supplier details, login and requests / سپلائر کی تفصیل، لاگ ان اور درخواستیں" />
      <SupplierDetail supplier={supplier} initialRequests={requests} />
    </div>
  );
}
