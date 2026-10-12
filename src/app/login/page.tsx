import Link from "next/link";
import { LoginLayout } from "@/components/brand/LoginLayout";
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
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Signing in as
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {role.label}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {role.description}
          </p>

          <LoginForm dashboardHref={role.dashboardHref} />

          <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            Not {role.label.toLowerCase()}?{" "}
            <Link
              href="/"
              className="font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400"
            >
              Choose a different role
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Self-service portals
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            Pump-level roles
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Attendant, Cashier, Security Guard, Pump Owner and Admin — each scoped to a single assigned pump.
          </p>
          <div className="mt-6">
            <RoleLoginForm />
          </div>
        </div>
      </div>
    </LoginLayout>
  );
}
