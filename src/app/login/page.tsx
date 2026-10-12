import Link from "next/link";
import { LoginLayout, LoginCard } from "@/components/brand/LoginLayout";
import { LoginForm } from "@/components/login-form";
import { RoleLoginForm } from "@/components/demo-auth/RoleLoginForm";
import { ROLES } from "@/lib/roles";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleSlug } = await searchParams;
  const role = ROLES.find((item) => item.slug === roleSlug) ?? ROLES[0];

  return (
    <LoginLayout>
      <LoginCard
        title="Welcome back"
        titleUr="خوش آمدید"
        subtitle={`Signing in as ${role.label}. ${role.description}`}
      >
        <LoginForm dashboardHref={role.dashboardHref} />

        <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          Not {role.label.toLowerCase()}?{" "}
          <Link
            href="/"
            className="font-medium text-amber-700 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Choose a different role
          </Link>
        </p>
      </LoginCard>

      <LoginCard
        heading="h2"
        title="Pump-level roles"
        subtitle="Attendant, Cashier, Security Guard, Pump Owner and Admin — each scoped to a single assigned pump."
      >
        <RoleLoginForm />
      </LoginCard>
    </LoginLayout>
  );
}
