import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";

export default function ConnectPage() {
  return (
    <div>
      <PageHeader title="Connect & Chat" description="Communicate with the Company support team." />
      <Card className="p-8">
        <EmptyState
          title="Coming soon"
          description="The chat and messaging feature will be available soon. Connect with our support team to address any issues or questions."
        />
      </Card>
    </div>
  );
}
