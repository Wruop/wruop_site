"use client";

import { useLocale } from "./LocaleProvider";
import styles from "./Icf.module.css";

/** ICF: Justa Causa. Sprint 05 adds the Iracir viewer and the mini demo; for now, honest status only. */
export function Icf() {
  const { t } = useLocale();
  return (
    <section id="icf" className={`section ${styles.icf}`} aria-labelledby="icf-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.copy}>
          <p className="kicker">{t.icf.kicker}</p>
          <h2 id="icf-title" className={`display ${styles.title}`}>
            {t.icf.title}
          </h2>
          <p className={styles.body}>{t.icf.body}</p>
          <ul role="list" className={styles.tech}>
            {t.icf.tech.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className={styles.next}>
          <h3 className={styles.nextLabel}>{t.icf.nextLabel}</h3>
          <ul role="list" className={styles.nextList}>
            {t.icf.next.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
