import Link from "next/link";
import { DropletIcon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";
import { ROLES } from "@/lib/roles";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleSlug } = await searchParams;
  const role = ROLES.find((item) => item.slug === roleSlug) ?? ROLES[0];

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <DropletIcon className="size-5" />
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-white">
            PetroManage
          </span>
        </Link>

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

          <LoginForm dashboardHref={role.dashboardHref} demoEmail={role.demoEmail} />

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
      </div>
    </div>
  );
}
