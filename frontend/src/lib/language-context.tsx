"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { t, translateTag, Locale, TranslationKey } from "@/lib/translations";

interface LanguageContextValue {
  locale: Locale;
  toggle: () => void;
  t: (key: TranslationKey) => string;
  translateTag: (tag: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved === "es" || saved === "en") setLocale(saved);
  }, []);

  const toggle = () => {
    const next: Locale = locale === "en" ? "es" : "en";
    setLocale(next);
    localStorage.setItem("locale", next);
  };

  const value: LanguageContextValue = {
    locale,
    toggle,
    t: (key) => t(key, locale),
    translateTag: (tag) => translateTag(tag, locale),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
