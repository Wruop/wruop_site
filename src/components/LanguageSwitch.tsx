"use client";

import type { MouseEvent } from "react";
import { useLocale } from "./LocaleProvider";
import { localeLabel, locales, swapLocaleInPath, type Locale } from "@/i18n/config";
import styles from "./LanguageSwitch.module.css";

/** [EN | PT-BR]. Real links (work without JS); with JS the switch swaps text in place. */
export function LanguageSwitch() {
  const { locale, t, setLocale } = useLocale();

  function onClick(event: MouseEvent<HTMLAnchorElement>, next: Locale) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    setLocale(next);
  }

  return (
    <nav className={styles.switch} aria-label={t.a11y.language}>
      <svg className={styles.globe} viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" />
        <path d="M1.75 8h12.5M8 1.75c1.9 2 2.75 4 2.75 6.25S9.9 12.25 8 14.25M8 1.75C6.1 3.75 5.25 5.75 5.25 8S6.1 12.25 8 14.25" />
      </svg>
      {locales.map((code, i) => {
        const active = code === locale;
        return (
          <span key={code} className={styles.item}>
            {i > 0 && <span className={styles.sep} aria-hidden="true">|</span>}
            <a
              href={swapLocaleInPath(`/${locale}/`, code)}
              hrefLang={code === "en" ? "en" : "pt-BR"}
              lang={code === "en" ? "en" : "pt-BR"}
              className={styles.option}
              aria-current={active ? "true" : undefined}
              onClick={(e) => onClick(e, code)}
            >
              {localeLabel[code]}
            </a>
          </span>
        );
      })}
    </nav>
  );
}
