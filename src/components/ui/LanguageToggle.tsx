"use client";

import { useLanguage } from "@/lib/language-context";
import type { Language } from "@/lib/translations";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-white p-1 dark:bg-slate-900">
      <button
        onClick={() => setLanguage("en")}
        className={`rounded px-3 py-1.5 text-xs font-medium transition ${
          language === "en"
            ? "bg-brand-500 text-white"
            : "text-ink-secondary hover:bg-surface-3"
        }`}
      >
        English
      </button>
      <button
        onClick={() => setLanguage("ur")}
        className={`rounded px-3 py-1.5 text-xs font-medium transition ${
          language === "ur"
            ? "bg-brand-500 text-white"
            : "text-ink-secondary hover:bg-surface-3"
        }`}
      >
        اردو
      </button>
      <button
        onClick={() => setLanguage("both")}
        className={`rounded px-3 py-1.5 text-xs font-medium transition ${
          language === "both"
            ? "bg-brand-500 text-white"
            : "text-ink-secondary hover:bg-surface-3"
        }`}
      >
        Both
      </button>
    </div>
  );
}
