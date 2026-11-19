"use client";

import { useLocale } from "./LocaleProvider";
import { stack } from "@/content/site";
import styles from "./Services.module.css";

export function Services() {
  const { t } = useLocale();
  return (
    <section id="services" className="section" aria-labelledby="services-title">
      <div className="wrap">
        <header className={styles.head}>
          <p className="kicker">{t.services.kicker}</p>
          <h2 id="services-title" className={`display ${styles.title}`}>
            {t.services.title}
          </h2>
        </header>

        <ol role="list" className={styles.list}>
          {t.services.items.map((item, i) => (
            <li key={item.name} className={styles.item}>
              <span className={styles.index} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={styles.name}>{item.name}</h3>
              <ul role="list" className={styles.points}>
                {item.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className={styles.stack}>
          <h3 className={styles.stackLabel}>{t.services.stackLabel}</h3>
          <ul role="list" className={styles.tags}>
            {stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
