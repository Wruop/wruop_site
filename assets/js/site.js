// Wruop home: contact address wiring. The address lives in one place: <html data-email="...">.
(() => {
  const root = document.documentElement;
  root.classList.add("js");

  const email = (root.dataset.email || "").trim();

  if (email) {
    document.querySelectorAll(".js-mail").forEach((a) => { a.href = `mailto:${email}`; });
    document.querySelectorAll(".js-mail-text").forEach((p) => {
      p.textContent = "";
      const a = document.createElement("a");
      a.href = `mailto:${email}`;
      a.textContent = email;
      p.append(a);
    });
    return;
  }

  // No address yet: the contact button says so instead of linking to its own section.
  document.querySelectorAll(".js-mail-main").forEach((a) => {
    a.removeAttribute("href");
    a.setAttribute("aria-disabled", "true");
    a.classList.add("is-pending");
    a.firstChild.textContent = "E-mail em breve ";
  });
  document.querySelectorAll(".js-mail-text").forEach((p) => { p.hidden = true; });
})();
