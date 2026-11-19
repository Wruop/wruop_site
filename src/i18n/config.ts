export const locales = ["en", "pt-br"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Value of the `lang` attribute and of `hreflang` for each route segment. */
export const htmlLang: Record<Locale, string> = { en: "en", "pt-br": "pt-BR" };

/** Short label shown in the language switch. */
export const localeLabel: Record<Locale, string> = { en: "EN", "pt-br": "PT-BR" };

export const STORAGE_KEY = "weider.locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "pt-br";
}

/** Locale from a pathname such as `/pt-br/` or `/en/work/`. */
export function localeFromPath(pathname: string | null): Locale | null {
  const first = (pathname ?? "").split("/").filter(Boolean)[0];
  return isLocale(first) ? first : null;
}

/** Same path in another locale: `/en/x/` → `/pt-br/x/`. */
export function swapLocaleInPath(pathname: string, to: Locale): string {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) parts[1] = to;
  else parts.splice(1, 0, to);
  const joined = parts.join("/");
  return joined.endsWith("/") ? joined : `${joined}/`;
}
