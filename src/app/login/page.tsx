import { AuthShell } from "@/components/auth/AuthShell";
import { RoleLoginForm } from "@/components/demo-auth/RoleLoginForm";
import { IconBuilding, IconDroplet, IconUsers, IconWallet } from "@/components/icons";

const DEMO_FEATURES = [
  { icon: IconBuilding, text: "Admin — a network-wide view across every pump" },
  { icon: IconDroplet, text: "Pump Owner — stock, sales, staff and payments for your pump" },
  { icon: IconUsers, text: "Fuel Attendant — start shifts and log dispensed fuel" },
  { icon: IconWallet, text: "Cashier — collect payments and reconcile the drawer" },
];

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome to the demo"
      subtitle="Pick a role to explore its dashboard — no account needed."
      homeHref="/login"
      heroTitle="One platform, every role at the pump."
      features={DEMO_FEATURES}
      portalLabel="Demo Login"
    >
      <RoleLoginForm />
    </AuthShell>
  );
}
