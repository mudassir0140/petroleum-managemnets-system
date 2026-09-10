import Link from "next/link";
import { DropletIcon } from "@/components/icons";

const FOOTER_LINKS = [
  {
    heading: "Platform",
    links: [
      { label: "Modules", href: "#modules" },
      { label: "Operations", href: "#operations" },
      { label: "Insights", href: "#insights" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#contact" },
      { label: "Careers", href: "#contact" },
      { label: "Contact sales", href: "#contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy", href: "#contact" },
      { label: "Terms of service", href: "#contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <DropletIcon className="size-5" />
              </span>
              <span className="text-base font-bold text-white">
                PetroManage
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              End-to-end petroleum management for depots, distributors, and
              retail stations.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              support@petromanage.example
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="text-sm font-semibold text-white">
                {group.heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} PetroManage. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Built for depots, distributors & retail fuel networks.
          </p>
        </div>
      </div>
    </footer>
  );
}
