"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { useLanguage, useTranslation } from "@/components/providers/LanguageProvider";
import type { Locale } from "@/lib/i18n/translations";

export function PreferencesCard() {
  const t = useTranslation();
  const { locale, setLocale } = useLanguage();

  return (
    <Card padding="md">
      <CardHeader><CardTitle>{t.settings.preferencesTitle}</CardTitle></CardHeader>
      <CardBody>
        <div className="flex items-center justify-between">
          <span className="text-sand-500 text-sm">{t.settings.language}</span>
          <div className="flex rounded overflow-hidden border border-warm">
            {(["en", "fr"] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={[
                  "px-4 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors",
                  locale === l
                    ? "bg-ember-500 text-white"
                    : "text-sand-400 hover:text-sand-200 hover:bg-bark-800",
                ].join(" ")}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
