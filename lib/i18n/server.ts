import { cookies, headers } from "next/headers";
import { translations, getLocaleFromString, type Locale } from "./translations";

export async function getServerTranslations() {
  // 1. Check pom-lang cookie (set by LanguageProvider on client)
  const cookieStore = await cookies();
  const lang = cookieStore.get("pom-lang")?.value;
  if (lang === "en" || lang === "fr") {
    return translations[lang as Locale];
  }

  // 2. Fall back to Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") ?? "en";
  const locale = getLocaleFromString(acceptLanguage);
  return translations[locale];
}
