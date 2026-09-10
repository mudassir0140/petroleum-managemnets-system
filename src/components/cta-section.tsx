import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

export function CtaSection() {
  return (
    <section className="bg-slate-950 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to modernize your fuel operations?
        </h2>
        <p className="mt-4 text-base text-slate-300">
          Join depots and retail networks already running on PetroManage to
          cut losses and stay compliant.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login?role=administrator"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
          >
            Get started
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            href="#contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-900"
          >
            Contact sales
          </Link>
        </div>
      </div>
    </section>
  );
}
