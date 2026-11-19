"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { STORAGE_KEY, htmlLang, localeFromPath, swapLocaleInPath, type Locale } from "@/i18n/config";
import { dictionaries, type Dictionary } from "@/i18n";

type LocaleContextValue = {
  locale: Locale;
  t: Dictionary;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function setMeta(selector: string, content: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", content);
}

/**
 * The locale comes from the URL (/en/ or /pt-br/). Switching does not navigate:
 * it pushes the other URL with the History API, which Next.js keeps in sync with
 * usePathname(), so the page (and any 3D scene) stays mounted while the text swaps.
 */
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const pathname = usePathname();
  const locale = localeFromPath(pathname) ?? initialLocale;
  const t = dictionaries[locale];

  useEffect(() => {
    document.documentElement.lang = htmlLang[locale];
    document.title = t.meta.title;
    setMeta('meta[name="description"]', t.meta.description);
    setMeta('meta[property="og:title"]', t.meta.title);
    setMeta('meta[property="og:description"]', t.meta.description);
    setMeta('meta[property="og:locale"]', locale === "en" ? "en_US" : "pt_BR");
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = new URL(`/${locale}/`, window.location.origin).href;
  }, [locale, t]);

  const setLocale = useCallback(
    (next: Locale) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage blocked: the choice still applies to this visit */
      }
      if (next === locale) return;
      const url = swapLocaleInPath(window.location.pathname, next) + window.location.hash;
      window.history.pushState(null, "", url);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside <LocaleProvider>");
  return value;
}
