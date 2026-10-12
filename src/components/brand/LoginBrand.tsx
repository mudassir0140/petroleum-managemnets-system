import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

// Logo + "VIO" wordmark and the tagline, shared by every login page so they match.
export function LoginBrand() {
  return (
    <div className="mb-8 flex flex-col items-center">
      <Link href="/" className="flex items-center justify-center gap-2.5">
        <Logo size="md" />
        <span className="flex h-11 items-center text-2xl font-bold text-slate-900 dark:text-white">
          VIO
        </span>
      </Link>
      <div className="mt-3 max-w-sm space-y-2 text-center text-slate-500 dark:text-slate-400">
        <p className="text-xs leading-relaxed">
          VIO brings all your petrol pumps into one smart system. Track sales, stock, staff and khata in one place, simply and securely.
        </p>
        <p dir="rtl" lang="ur" className="urdu-font text-sm leading-loose">
          VIO آپ کے تمام پٹرول پمپس کو ایک سمارٹ سسٹم میں جوڑتا ہے۔ سیلز، اسٹاک، عملہ اور کھاتہ سب کچھ ایک ہی جگہ، آسانی اور حفاظت کے ساتھ۔
        </p>
      </div>
    </div>
  );
}
