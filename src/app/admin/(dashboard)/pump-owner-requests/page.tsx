import { getPendingPumpOwnerSignupRequests, approvePumpOwnerSignupRequest, rejectPumpOwnerSignupRequest } from "@/lib/pump-owner/signup-actions";
import { getAdminSession } from "@/lib/admin/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import ApprovePumpRequestButton from "./approve-pump-request-button";
import RejectPumpRequestButton from "./reject-pump-request-button";

export const dynamic = "force-dynamic";

export default async function PumpOwnerRequestsPage() {
  await getAdminSession();

  const requests = await getPendingPumpOwnerSignupRequests();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pump Owner Signup Requests"
        description="Review and approve pending pump owner signup requests"
      />

      {requests.length === 0 ? (
        <SectionCard>
          <div className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">No pending pump owner signup requests</p>
          </div>
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Pump Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Owner Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                      {req.pumpName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {req.ownerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {req.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {req.ownerPhone}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {req.city}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <ApprovePumpRequestButton requestId={req.id} pumpId={req.pumpId} adminId="admin-1" />
                        <RejectPumpRequestButton requestId={req.id} adminId="admin-1" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
