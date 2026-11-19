"use client";

import { useLocale } from "./LocaleProvider";
import { projectStack } from "@/content/site";
import styles from "./Work.module.css";

type StatusKey = "building" | "planned" | "live";

export function Work() {
  const { t } = useLocale();
  return (
    <section id="work" className="section" aria-labelledby="work-title">
      <div className="wrap">
        <header className={styles.head}>
          <p className="kicker">{t.work.kicker}</p>
          <h2 id="work-title" className={`display ${styles.title}`}>
            {t.work.title}
          </h2>
          <p className="prose">{t.work.intro}</p>
        </header>

        <ol role="list" className={styles.list}>
          {t.work.projects.map((p, i) => {
            const status = p.status as StatusKey;
            return (
              <li key={p.id} className={styles.project} data-status={status}>
                <span className={styles.index} aria-hidden="true">
                  P{i + 1}
                </span>
                <div className={styles.main}>
                  <p className={styles.kind}>{p.kind}</p>
                  <h3 className={styles.name}>{p.name}</h3>
                  <p className={styles.summary}>{p.summary}</p>
                </div>
                <dl className={styles.facts}>
                  <div>
                    <dt>{t.work.statusLabel}</dt>
                    <dd>
                      <span className={styles.status} data-status={status}>
                        {t.work.status[status]}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>{t.work.problemLabel}</dt>
                    <dd>{p.problem}</dd>
                  </div>
                  <div>
                    <dt>{t.work.stackLabel}</dt>
                    <dd>{(projectStack[p.id] ?? []).join(" · ")}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
