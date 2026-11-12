// Wruop · comportamento da página: barra superior, menu no celular, seção atual e formulário de contato.
(() => {
  "use strict";

  const t = window.wruopT || ((k) => k);
  const config = (window.WRUOP_CONFIG && window.WRUOP_CONFIG.contact) || {};

  /* ---------- Barra superior ---------- */

  const bar = document.querySelector("[data-bar]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  const mobile = matchMedia("(max-width: 860px)");

  if (bar) {
    const onScroll = () => bar.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function setMenu(open) {
    if (!bar || !toggle) return;
    bar.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".bar__toggle-label").textContent = open ? t("menuClose") : t("menuOpen");
    if (menu) menu.inert = mobile.matches && !open;
  }
  if (toggle && menu) {
    setMenu(false);
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && bar.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
    });
    const onBreak = () => { setMenu(false); if (!mobile.matches) menu.inert = false; };
    if (mobile.addEventListener) mobile.addEventListener("change", onBreak);
  }

  /* ---------- Seção atual no menu ---------- */

  const links = Array.from(document.querySelectorAll(".bar__links a[href^='#']"));
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
      const current = sections.find((s) => seen.get(s.id));
      links.forEach((a) => {
        if (current && a.getAttribute("href") === "#" + current.id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Contato ---------- */

  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const email = String(config.email || "").trim();
  const whatsapp = String(config.whatsapp || "").replace(/\D/g, "");
  const endpoint = String(config.formEndpoint || "").trim();

  const fields = form.querySelector("[data-form-fields]");
  const notice = form.querySelector("[data-form-notice]");
  const result = form.querySelector("[data-form-result]");
  const submit = form.querySelector("[data-submit]");
  const submitLabel = form.querySelector("[data-submit-label]");
  const channels = document.querySelector("[data-channels]");

  // Canais diretos: só aparecem os que existem.
  if (channels && (email || whatsapp)) {
    const add = (label, href, text, external) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "link";
      a.href = href;
      a.textContent = text;
      a.setAttribute("aria-label", `${label}: ${text}`);
      if (external) { a.target = "_blank"; a.rel = "noopener"; }
      li.append(a);
      channels.append(li);
    };
    if (email) add(t("channelEmail"), `mailto:${email}`, email, false);
    if (whatsapp) add(t("channelWhatsapp"), `https://wa.me/${whatsapp}`, `WhatsApp +${whatsapp}`, true);
    channels.hidden = false;
  }

  // Sem nenhum destino configurado, o formulário diz isso e não finge que envia.
  if (!endpoint && !email) {
    notice.innerHTML = t("pending");
    notice.hidden = false;
    fields.disabled = true;
    form.setAttribute("aria-describedby", notice.id || "");
    return;
  }
  if (!endpoint && email) {
    submitLabel.textContent = t("submitMail");
    notice.textContent = t("mailOnly");
    notice.hidden = false;
  }

  const MIN_MESSAGE = 10;

  function setError(name, message) {
    const input = form.elements[name];
    const out = form.querySelector(`[data-error-for="${name}"]`);
    if (!input || !out) return;
    out.textContent = message || "";
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function validate() {
    const v = (name) => String(form.elements[name].value || "").trim();
    const errors = {};
    if (!v("nome")) errors.nome = t("errRequired");
    if (!v("email")) errors.email = t("errRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) errors.email = t("errEmail");
    if (!v("mensagem")) errors.mensagem = t("errRequired");
    else if (v("mensagem").length < MIN_MESSAGE) errors.mensagem = t("errShort");
    ["nome", "email", "mensagem"].forEach((k) => setError(k, errors[k]));
    return Object.keys(errors);
  }

  // Corrige o erro assim que o campo fica válido, sem acusar antes de a pessoa terminar.
  ["nome", "email", "mensagem"].forEach((name) => {
    form.elements[name].addEventListener("input", () => {
      if (form.elements[name].getAttribute("aria-invalid") === "true") validate();
    });
  });

  function say(text, tone) {
    result.textContent = text;
    if (tone) result.dataset.tone = tone; else delete result.dataset.tone;
  }

  function busy(on) {
    submit.disabled = on;
    submit.setAttribute("aria-busy", String(on));
    submitLabel.textContent = on ? t("sending") : (endpoint ? t("submit") : t("submitMail"));
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    say("");
    const bad = validate();
    if (bad.length) { form.elements[bad[0]].focus(); return; }

    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());

    if (!endpoint) {
      // Só e-mail: abre o app de e-mail com tudo preenchido. Não há como saber se foi enviado, então não dizemos que foi.
      const subject = t("mailSubject", values);
      const body = t("mailBody", values);
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      say(t("mailOpened", { email }));
      return;
    }

    busy(true);
    try {
      const res = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      say(t("sent"));
    } catch (err) {
      say(email ? t("failedWithEmail", { email }) : t("failed"), "error");
    } finally {
      busy(false);
    }
  });
})();
