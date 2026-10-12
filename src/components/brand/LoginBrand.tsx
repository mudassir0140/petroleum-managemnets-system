import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ChartBarIcon, FactoryIcon, ShieldCheckIcon, type IconProps } from "@/components/icons";
import type { ComponentType } from "react";

const FEATURES: { label: string; icon: ComponentType<IconProps> }[] = [
  { label: "Manage multiple pumps", icon: FactoryIcon },
  { label: "Live sales and stock", icon: ChartBarIcon },
  { label: "Secure khata and shifts", icon: ShieldCheckIcon },
];

// Branding panel for every login page. Laptop (lg+): full-height left column with
// the headline, taglines and feature points. Mobile: a compact header on top with
// the logo, VIO and a one-line tagline.
export function LoginBrand() {
  return (
    <aside className="flex flex-col gap-8 border-b border-slate-200 bg-linear-to-br from-amber-50 via-white to-amber-100/60 px-6 py-6 sm:px-10 lg:flex-1 lg:justify-between lg:border-r lg:border-b-0 lg:px-14 lg:py-14 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/50">
      <Link href="/" className="flex items-center gap-3 self-start">
        <Logo size="md" />
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">VIO</span>
      </Link>

      <p className="text-sm leading-relaxed text-slate-600 lg:hidden dark:text-slate-300">
        Track sales, stock, staff and khata in one place.
      </p>

      <div className="hidden lg:block">
        <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
          Run every pump from one place.
        </h2>
        <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-300">
          VIO brings all your petrol pumps into one smart system. Track sales, stock, staff and khata in one place, simply and securely.
        </p>
        <p dir="rtl" lang="ur" className="urdu-font mt-4 max-w-md text-right text-lg leading-loose text-slate-700 dark:text-slate-200">
          VIO آپ کے تمام پٹرول پمپس کو ایک سمارٹ سسٹم میں جوڑتا ہے۔ سیلز، اسٹاک، عملہ اور کھاتہ سب کچھ ایک ہی جگہ، آسانی اور حفاظت کے ساتھ۔
        </p>

        <ul className="mt-10 space-y-4">
          {FEATURES.map(({ label, icon: Icon }) => (
            <li key={label} className="flex items-center gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-amber-400 dark:ring-slate-700">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="text-base font-medium text-slate-800 dark:text-slate-100">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
