import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

// Left column of every login page: logo + "VIO" wordmark, then the English and
// Urdu taglines. Centered on mobile, left/right aligned on laptop.
export function LoginBrand({ englishOnly = false }: { englishOnly?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
      <Link href="/" className="flex items-center gap-2.5">
        <Logo size="md" />
        <span className="flex h-11 items-center text-2xl font-bold text-slate-900 dark:text-white">
          VIO
        </span>
      </Link>
      <div className="mt-4 max-w-sm space-y-3 text-slate-500 dark:text-slate-400">
        <p className="text-xs leading-relaxed text-center lg:text-left">
          VIO brings all your petrol pumps into one smart system. Track sales, stock, staff and khata in one place, simply and securely.
        </p>
        {!englishOnly && (
          <p dir="rtl" lang="ur" className="urdu-font text-sm leading-loose text-center lg:text-right">
            VIO آپ کے تمام پٹرول پمپس کو ایک سمارٹ سسٹم میں جوڑتا ہے۔ سیلز، اسٹاک، عملہ اور کھاتہ سب کچھ ایک ہی جگہ، آسانی اور حفاظت کے ساتھ۔
          </p>
        )}
      </div>
    </div>
  );
}
