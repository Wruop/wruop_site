// Wruop home: the cue timeline. Scroll (or the scrubber, or the cue labels) advances the show.
(() => {
  const root = document.documentElement;
  root.classList.add("js");

  // Contact address lives in one place: <html data-email="...">.
  const email = (root.dataset.email || "").trim();
  if (!email) {
    // No address yet: the contact button says so instead of linking to its own section.
    document.querySelectorAll(".contact .js-mail").forEach((a) => {
      a.removeAttribute("href");
      a.setAttribute("aria-disabled", "true");
      a.classList.add("is-pending");
      a.textContent = "E-mail em breve";
    });
    document.querySelectorAll(".js-mail-text").forEach((p) => { p.hidden = true; });
  }
  if (email) {
    document.querySelectorAll(".js-mail").forEach((a) => { a.href = `mailto:${email}`; });
    document.querySelectorAll(".js-mail-text").forEach((p) => {
      p.textContent = "";
      const a = document.createElement("a");
      a.href = `mailto:${email}`;
      a.textContent = email;
      p.append(a);
    });
  }

  const show = document.querySelector(".show");
  const frame = document.querySelector(".frame");
  const track = document.querySelector(".track");
  const tabs = [...document.querySelectorAll(".cue")];
  const panels = [...document.querySelectorAll(".panel")];
  if (!show || !frame || !track) return;

  // Comp-pixel geometry of the timeline (approved comp, 2752 wide).
  const CENTERS = [504, 1109, 1679, 2254];
  const BOUNDS = [220, 806.5, 1394, 1966.5, 2529];
  const HERO_HEAD = 795;
  const LEAVE_END = 0.12; // share of the show spent lifting the intro off
  const CUES_FROM = 0.06; // where the first cue's window starts

  const stacked = window.matchMedia("(max-aspect-ratio: 5/4), (max-width: 760px)");
  let active = -1;

  panels.forEach((p) => p.removeAttribute("hidden"));

  // Phones: the handle sits under the active tab's centre, in CSS pixels.
  function placeMobileHandle(i) {
    if (!stacked.matches || !tabs[i]) return;
    const t = tabs[i].getBoundingClientRect();
    const r = track.getBoundingClientRect();
    track.style.setProperty("--mx", `${(t.left + t.width / 2 - r.left).toFixed(1)}px`);
  }

  function setActive(i) {
    if (i === active) return;
    active = i;
    frame.dataset.cue = String(i);
    track.style.setProperty("--handle", CENTERS[i]);
    placeMobileHandle(i);
    tabs.forEach((t, n) => {
      const on = n === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, n) => {
      const on = n === i;
      p.classList.toggle("is-active", on);
      p.inert = !on;
      p.setAttribute("aria-hidden", String(!on));
    });
  }

  function showRange() {
    const top = show.getBoundingClientRect().top + window.scrollY;
    const span = show.offsetHeight - window.innerHeight;
    return { top, span: Math.max(span, 1) };
  }

  function progress() {
    const { top, span } = showRange();
    return Math.min(Math.max((window.scrollY - top) / span, 0), 1);
  }

  // s in [0,1] -> u in [0,4]: which cue, and how far through it.
  const toU = (s) => Math.min(Math.max(((s - CUES_FROM) / (1 - CUES_FROM)) * 4, 0), 3.9999);
  const fromU = (u) => CUES_FROM + (u / 4) * (1 - CUES_FROM);

  function render() {
    ticking = false;
    if (stacked.matches) { placeMobileHandle(active); return; }
    const s = progress();
    const leave = Math.min(s / LEAVE_END, 1);
    frame.style.setProperty("--leave", leave.toFixed(3));
    frame.classList.toggle("is-live", leave > 0.5);

    const u = toU(s);
    const i = Math.floor(u);
    const f = u - i;
    const from = i === 0 ? HERO_HEAD : BOUNDS[i];
    const head = i === 0 && leave < 1 ? HERO_HEAD : from + (BOUNDS[i + 1] - from) * f;
    track.style.setProperty("--head", head.toFixed(1));
    setActive(i);
  }

  let ticking = false;
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };

  function goTo(i, smooth = true) {
    if (stacked.matches) { setActive(i); return; }
    const { top, span } = showRange();
    const s = Math.max(fromU(i + 0.35), LEAVE_END + 0.02);
    window.scrollTo({ top: top + s * span, behavior: smooth ? "smooth" : "auto" });
  }

  tabs.forEach((t, n) => t.addEventListener("click", () => goTo(n)));

  document.querySelector(".cues__labels").addEventListener("keydown", (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = null;
    if (e.key in keys) next = (active + keys[e.key] + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    tabs[next].focus();
    goTo(next);
  });

  // Scrubbing the track sets the scroll position directly.
  function scrubTo(clientX) {
    const r = track.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 2752;
    const clamped = Math.min(Math.max(x, BOUNDS[0]), BOUNDS[4] - 0.5);
    let i = BOUNDS.findIndex((b, n) => clamped >= b && clamped < BOUNDS[n + 1]);
    if (i < 0) i = 3;
    const u = i + (clamped - BOUNDS[i]) / (BOUNDS[i + 1] - BOUNDS[i]);
    const { top, span } = showRange();
    window.scrollTo({ top: top + Math.max(fromU(u), LEAVE_END + 0.01) * span, behavior: "auto" });
  }
  track.addEventListener("pointerdown", (e) => {
    track.setPointerCapture(e.pointerId);
    track.classList.add("is-dragging");
    root.style.scrollBehavior = "auto";
    scrubTo(e.clientX);
  });
  track.addEventListener("pointermove", (e) => { if (track.hasPointerCapture(e.pointerId)) scrubTo(e.clientX); });
  const release = () => { track.classList.remove("is-dragging"); root.style.scrollBehavior = ""; };
  track.addEventListener("pointerup", release);
  track.addEventListener("pointercancel", release);

  // "O que fazemos" lands on the first cue, not on the headline it already passed.
  document.querySelectorAll('a[href="#o-que-fazemos"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      if (stacked.matches) return;
      e.preventDefault();
      goTo(0);
    })
  );

  function reset() {
    if (stacked.matches) {
      frame.style.removeProperty("--leave");
      frame.classList.add("is-live");
      if (active < 0) setActive(0);
    }
    placeMobileHandle(Math.max(active, 0));
    queue();
  }

  setActive(0);
  reset();
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  stacked.addEventListener("change", reset);
})();
