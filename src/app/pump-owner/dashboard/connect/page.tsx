import { PageHeader } from "@/components/ui/PageHeader";
import { ConnectHub } from "@/components/dashboard/ConnectHub";
import { getSession } from "@/lib/session";
import { getDirectory } from "@/lib/demo-data";
import { simulateLatency } from "@/lib/utils";

export default async function ConnectPage() {
  await simulateLatency();
  const session = await getSession();
  const directory = getDirectory(session.ownerId);

  return (
    <div>
      <PageHeader title="Connect & Chat" description="Find and message other Pump Owners, and chat directly with the Company." />
      <ConnectHub initialDirectory={directory} ownerId={session.ownerId} ownerName={session.ownerName} />
    </div>
  );
}
