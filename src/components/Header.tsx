"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { LanguageSwitch } from "./LanguageSwitch";
import styles from "./Header.module.css";

const SECTIONS = ["services", "work", "lab", "about", "contact"] as const;
type SectionId = (typeof SECTIONS)[number];

export function Header() {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<SectionId | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Active section: the last section whose top has passed 40% of the viewport.
  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    const update = () => {
      setScrolled(window.scrollY > 8);
      const line = window.innerHeight * 0.4;
      let current: SectionId | null = null;
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id as SectionId;
      // ICF sits between Lab and About; keep "Lab" lit there.
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Mobile menu: Escape closes and returns focus; focus moves into the panel on open; page does not scroll behind it.
  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>("a, button"));
        const all = [toggleRef.current, ...items].filter((el): el is HTMLElement => Boolean(el));
        const i = all.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          all[all.length - 1].focus();
        } else if (!e.shiftKey && i === all.length - 1) {
          e.preventDefault();
          all[0].focus();
        }
      }
    };
    const mq = window.matchMedia("(min-width: 56rem)");
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    document.documentElement.dataset.menuOpen = "true";
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
      delete document.documentElement.dataset.menuOpen;
    };
  }, [open]);

  const links = SECTIONS.map((id) => (
    <li key={id}>
      <a
        href={`#${id}`}
        className={styles.link}
        aria-current={active === id ? "location" : undefined}
        onClick={() => setOpen(false)}
      >
        {t.nav[id]}
      </a>
    </li>
  ));

  return (
    <header className={styles.header} data-scrolled={scrolled || undefined}>
      <a className={styles.skip} href="#main">
        {t.a11y.skip}
      </a>
      <div className={styles.bar}>
        <a className={styles.brand} href={`/${locale}/`} aria-label={t.a11y.home}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/w-mark-64.png" width={71} height={64} alt="" className={styles.mark} />
          <span className={styles.wordmark} aria-hidden="true">
            Weider<span className={styles.dot}>.</span>
          </span>
        </a>

        <nav className={styles.nav} aria-label={t.a11y.primaryNav}>
          <ul role="list" className={styles.list}>
            {links}
          </ul>
        </nav>

        <div className={styles.tools}>
          <LanguageSwitch />
          <button
            ref={toggleRef}
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="visually-hidden">{open ? t.a11y.closeMenu : t.a11y.openMenu}</span>
            <span className={styles.burger} data-open={open || undefined} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div id="mobile-menu" ref={panelRef} className={styles.panel} data-open={open || undefined} hidden={!open}>
        <nav aria-label={t.a11y.primaryNav}>
          <ul role="list" className={styles.panelList}>
            {links}
          </ul>
        </nav>
      </div>
    </header>
  );
}
