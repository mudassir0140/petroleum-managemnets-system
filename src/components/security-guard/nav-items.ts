import { IconAlertTriangle, IconCar, IconFlag, IconHome, IconShield, IconUsers } from "@/components/icons";

export const SECURITY_GUARD_NAV_ITEMS = [
  { href: "/security-guard/dashboard", label: "Daily Activity", icon: IconHome, match: "exact" as const },
  { href: "/security-guard/dashboard/monitor", label: "Monitor Pump Security", icon: IconShield },
  { href: "/security-guard/dashboard/visitors", label: "Visitor Log", icon: IconUsers },
  { href: "/security-guard/dashboard/vehicles", label: "Vehicle Entry/Exit", icon: IconCar },
  { href: "/security-guard/dashboard/incidents", label: "Record Incidents", icon: IconAlertTriangle },
  { href: "/security-guard/dashboard/report-issue", label: "Report Security Issue", icon: IconFlag },
];
