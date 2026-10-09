"use client";

import { useLanguage } from "@/lib/language-context";
import { getText, getBilingual, type TranslationKey } from "@/lib/translations";

export function useTranslation() {
  const { language } = useLanguage();

  return {
    t: (key: TranslationKey): string => getText(key, language),
    tb: (key: TranslationKey): string => getBilingual(key),
  };
}
