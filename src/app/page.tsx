import { redirect } from "next/navigation";
import { getDemoRole } from "@/lib/demo/session";
import { getRoleMeta } from "@/lib/demo/roles";

export default async function Home() {
  const role = await getDemoRole();
  redirect(role ? getRoleMeta(role).dashboardPath : "/login");
}
