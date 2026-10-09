"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { Language } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved language from localStorage
    try {
      const saved = localStorage.getItem("language") as Language | null;
      if (saved && ["en", "ur", "both"].includes(saved)) {
        setLanguageState(saved);
      }
    } catch (e) {
      // localStorage might not be available
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("language", lang);
    } catch (e) {
      // localStorage might not be available
    }
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL: language === "ur" }}>
      <div dir={language === "ur" ? "rtl" : "ltr"} className={language === "ur" ? "urdu-font" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
