"use client";

import { useLocale } from "./LocaleProvider";
import styles from "./Footer.module.css";

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.row}`}>
        <p>
          © {new Date().getFullYear()} {t.footer.rights}
        </p>
        <a className={styles.top} href="#top">
          {t.footer.top}
        </a>
      </div>
    </footer>
  );
}
