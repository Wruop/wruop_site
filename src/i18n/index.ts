import en, { type Dictionary } from "./en";
import ptBr from "./pt-br";
import type { Locale } from "./config";

export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { en, "pt-br": ptBr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
