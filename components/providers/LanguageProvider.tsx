"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, getLocaleFromString, type Locale } from "@/lib/i18n/translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof translations["en"];
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    // 1. Check manual override in localStorage
    const stored = localStorage.getItem("pom-lang") as Locale | null;
    if (stored === "en" || stored === "fr") {
      setLocaleState(stored);
      document.cookie = `pom-lang=${stored};path=/;max-age=31536000`;
      return;
    }
    // 2. Auto-detect from browser language
    const detected = getLocaleFromString(navigator.language);
    setLocaleState(detected);
    document.cookie = `pom-lang=${detected};path=/;max-age=31536000`;
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("pom-lang", l);
    document.cookie = `pom-lang=${l};path=/;max-age=31536000`;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext).t;
}

export function useLanguage() {
  const { locale, setLocale } = useContext(LanguageContext);
  return { locale, setLocale };
}
