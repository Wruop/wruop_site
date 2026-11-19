"use client";

import { useLocale } from "./LocaleProvider";
import styles from "./Hero.module.css";

/**
 * Commercial message on the left; on the right, the stage that will hold the 3D particle cat (Sprint 03).
 * Until then the stage shows the official mark, which also stays as the static / no-WebGL / reduced-motion fallback.
 */
export function Hero() {
  const { t } = useLocale();
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.copy}>
          <p className="kicker">{t.hero.eyebrow}</p>
          <h1 id="hero-title" className={`display ${styles.title}`}>
            {t.hero.title}
          </h1>
          <p className={styles.lead}>{t.hero.lead}</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#work">
              {t.hero.ctaPrimary}
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
              </svg>
            </a>
            <a className={styles.secondary} href="#contact">
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>

        <figure className={styles.stage}>
          <div className={styles.stageGrid} aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.mark}
            src="/brand/w-mark.png"
            width={913}
            height={819}
            alt={t.hero.stageAlt}
            fetchPriority="high"
          />
          <figcaption className={styles.caption}>
            <span className={styles.captionName}>{t.hero.stageLabel}</span>
            <span className={styles.captionStatus}>
              <span className={styles.pulse} aria-hidden="true" />
              {t.hero.stageStatus}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
