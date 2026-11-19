"use client";

import { useLocale } from "./LocaleProvider";
import { gravityExperimentPath } from "@/content/site";
import styles from "./Lab.module.css";

export function Lab() {
  const { t } = useLocale();
  const exp = t.lab.experiments[0];
  return (
    <section id="lab" className="section" aria-labelledby="lab-title">
      <div className={`wrap ${styles.grid}`}>
        <header className={styles.head}>
          <p className="kicker">{t.lab.kicker}</p>
          <h2 id="lab-title" className={`display ${styles.title}`}>
            {t.lab.title}
          </h2>
          <p className="prose">{t.lab.intro}</p>
        </header>

        <article className={styles.experiment}>
          <a className={styles.media} href={gravityExperimentPath} tabIndex={-1} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/work/gravity-duck-800.webp"
              srcSet="/work/gravity-duck-800.webp 800w, /work/gravity-duck-1600.webp 1600w"
              sizes="(min-width: 56rem) 40vw, 100vw"
              width={800}
              height={500}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </a>
          <div className={styles.body}>
            <h3 className={styles.name}>{exp.name}</h3>
            <p className={styles.what}>{exp.what}</p>
            <ul role="list" className={styles.tags}>
              {exp.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <a className={styles.cta} href={gravityExperimentPath}>
              {exp.cta}
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8h10M8.5 3.5 13 8l-4.5 4.5" />
              </svg>
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
