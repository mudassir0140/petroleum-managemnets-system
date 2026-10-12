import type { ReactNode } from "react";
import { LoginBrand } from "@/components/brand/LoginBrand";

// Shared frame for every login page. Laptop (lg+): brand panel and form side by
// side, full height. Mobile: brand header on top, form card below. Layout is
// driven by Tailwind breakpoints only, so server and client render the same markup.
export function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white lg:flex-row dark:bg-slate-950">
      <LoginBrand />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
        <div className="flex w-full max-w-[420px] flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}

// The white card that holds a login form. Every login page uses it so the
// headings, padding and corner radius match.
export function LoginCard({
  title,
  titleUr,
  subtitle,
  heading = "h1",
  children,
  footer,
}: {
  title: string;
  titleUr?: string;
  subtitle?: string;
  heading?: "h1" | "h2";
  children: ReactNode;
  // Page-specific links (for example "Create one" on admin). Passed in by each page.
  footer?: ReactNode;
}) {
  const Heading = heading;

  return (
    <section className="w-full rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200 sm:p-8 dark:bg-slate-900 dark:ring-slate-800">
      <header>
        <Heading className="flex flex-wrap items-baseline gap-x-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          <span>{title}</span>
          {titleUr && (
            <span className="flex items-baseline gap-2 text-slate-400 dark:text-slate-500">
              <span aria-hidden="true">/</span>
              <span dir="rtl" lang="ur" className="urdu-font text-xl font-semibold text-slate-700 dark:text-slate-200">
                {titleUr}
              </span>
            </span>
          )}
        </Heading>
        {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </header>
      <div className="mt-6">{children}</div>
      {footer && (
        <div className="mt-6 border-t border-slate-200 pt-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          {footer}
        </div>
      )}
    </section>
  );
}
