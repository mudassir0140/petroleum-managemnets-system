"use client";

import Link from "next/link";
import { IconArrowLeft } from "@/components/icons";

// The one Back link used on pages that have no header Back of their own.
// Same label as the dashboard header: "Back / واپس".
export function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
    >
      <IconArrowLeft size={16} />
      Back / واپس
    </Link>
  );
}
