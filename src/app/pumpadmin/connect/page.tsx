import { PageHeader } from "@/components/ui/PageHeader";
import { PumpConnect } from "@/components/pumpadmin/connect/PumpConnect";

export default function ConnectPage() {
  return (
    <div>
      <PageHeader title="Connect & Chat" description="Communicate with the Company support team." />
      <PumpConnect />
    </div>
  );
}
