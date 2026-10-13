import type { ReactNode } from "react";
import { LoginBrand } from "@/components/brand/LoginBrand";

// Shared frame for every login page. Laptop: brand on the left, form card on the
// right, both vertically centered. Mobile: brand on top, form below.
export function LoginLayout({ children, englishOnly = false }: { children: ReactNode; englishOnly?: boolean }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-4 py-12 lg:py-16 dark:bg-slate-950">
      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <LoginBrand englishOnly={englishOnly} />
        <div className="flex w-full justify-center lg:justify-end">{children}</div>
      </div>
    </div>
  );
}
