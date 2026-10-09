"use client";

import Link from "next/link";
import { IconArrowLeft } from "@/components/icons";

export function BackButton({ href = "/pumpadmin" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
    >
      <IconArrowLeft size={16} />
      Back to Dashboard
    </Link>
  );
}
