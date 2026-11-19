"use client";

import { useLocale } from "./LocaleProvider";
import { contact } from "@/content/site";
import styles from "./AboutContact.module.css";

export function AboutContact() {
  const { t } = useLocale();
  const channels = [
    contact.upwork && { key: "upwork", label: t.contact.upwork, href: contact.upwork, external: true },
    contact.github && { key: "github", label: t.contact.github, href: contact.github, external: true },
    contact.email && { key: "email", label: `${t.contact.email} · ${contact.email}`, href: `mailto:${contact.email}`, external: false },
  ].filter((c): c is { key: string; label: string; href: string; external: boolean } => Boolean(c));

  return (
    <>
      <section id="about" className="section" aria-labelledby="about-title">
        <div className={`wrap ${styles.about}`}>
          <header className={styles.head}>
            <p className="kicker">{t.about.kicker}</p>
            <h2 id="about-title" className={`display ${styles.title}`}>
              {t.about.title}
            </h2>
          </header>
          <div className={styles.text}>
            {t.about.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className={styles.strengths}>
            <h3 className={styles.label}>{t.about.strengthsLabel}</h3>
            <ul role="list">
              {t.about.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="contact" className={`section ${styles.contactSection}`} aria-labelledby="contact-title">
        <div className={`wrap ${styles.contact}`}>
          <p className="kicker">{t.contact.kicker}</p>
          <h2 id="contact-title" className={`display ${styles.contactTitle}`}>
            {t.contact.title}
          </h2>
          <p className={styles.contactBody}>{t.contact.body}</p>

          {channels.length > 0 ? (
            <ul role="list" className={styles.channels}>
              {channels.map((c) => (
                <li key={c.key}>
                  <a
                    className={styles.channel}
                    href={c.href}
                    {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {c.label}
                    {c.external && <span className="visually-hidden"> ({t.a11y.newTab})</span>}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.pending} role="status">
              {t.contact.pending}
            </p>
          )}

          <p className={styles.upwork}>{t.contact.upworkNote}</p>
        </div>
      </section>
    </>
  );
}
