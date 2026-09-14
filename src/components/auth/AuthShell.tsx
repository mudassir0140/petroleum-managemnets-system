import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { IconDroplet, IconShield, IconTrendingUp, IconUsers } from "@/components/icons";

interface Feature {
  icon: ComponentType<{ size?: number }>;
  text: string;
}

const OWNER_FEATURES: Feature[] = [
  { icon: IconTrendingUp, text: "Real-time sales, stock and revenue for your pump only" },
  { icon: IconShield, text: "Strict data isolation — your records never mix with other pumps" },
  { icon: IconUsers, text: "Manage staff, tankers, payments and reports in one place" },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  homeHref = "/pump-owner/login",
  heroTitle = "Run your fuel station with a single, secure dashboard.",
  features = OWNER_FEATURES,
  portalLabel = "Pump Owner Portal",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  homeHref?: string;
  heroTitle?: string;
  features?: Feature[];
  portalLabel?: string;
}) {
  return (
    <div className="flex min-h-screen bg-surface-2">
      <div
        className="relative hidden w-[42%] flex-col justify-between overflow-hidden px-10 py-12 text-white lg:flex"
        style={{ background: "linear-gradient(160deg, var(--brand-800), var(--brand-600) 55%, var(--fuel-petrol) 130%)" }}
      >
        <Link href={homeHref} className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <IconDroplet size={22} />
          </span>
          <span className="text-lg font-semibold tracking-tight">Petroleum Management System</span>
        </Link>

        <div>
          <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight">{heroTitle}</h2>
          <ul className="mt-8 space-y-4">
            {features.map((f) => (
              <li key={f.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <f.icon size={16} />
                </span>
                <span className="text-sm leading-relaxed text-white/90">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/60">© {new Date().getFullYear()} Petroleum Management System. {portalLabel}.</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <IconDroplet size={19} />
            </span>
            <span className="text-base font-semibold tracking-tight text-ink-primary">Petroleum Management System</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-ink-secondary">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
