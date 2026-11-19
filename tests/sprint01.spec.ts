import { expect, test, type Page } from "@playwright/test";

const EN_H1 = "Built to work. Made to move.";
const PT_H1 = "Feito para funcionar. Criado para surpreender.";

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

async function openSwitch(page: Page, label: "EN" | "PT-BR") {
  // On narrow screens the switch stays in the bar, so it is always reachable.
  await page.getByRole("navigation", { name: /^(Language|Idioma)$/ }).getByRole("link", { name: label }).click();
}

test.describe("language", () => {
  test("new visitors land on English", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(EN_H1);
  });

  test("each route ships its own lang, title, description and hreflang", async ({ page }) => {
    for (const [path, lang, h1, titleStart] of [
      ["/en/", "en", EN_H1, "Weider · Web developer"],
      ["/pt-br/", "pt-BR", PT_H1, "Weider · Desenvolvedor web"],
    ] as const) {
      // JS off: what search engines and link previews read.
      const ctx = await page.context().browser()!.newContext({ javaScriptEnabled: false });
      const p = await ctx.newPage();
      await p.goto(path);
      await expect(p.locator("html")).toHaveAttribute("lang", lang);
      await expect(p).toHaveTitle(new RegExp(`^${titleStart}`));
      await expect(p.getByRole("heading", { level: 1 })).toHaveText(h1);
      await expect(p.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
      await expect(p.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", /\/en\/$/);
      await expect(p.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveAttribute("href", /\/pt-br\/$/);
      await expect(p.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute("href", /\/en\/$/);
      await ctx.close();
    }
  });

  test("switching swaps text in place, updates URL/lang/title and persists", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/en/");
    await page.evaluate(() => ((window as unknown as { __noReload: boolean }).__noReload = true));
    const markBefore = await page.locator("figure img").elementHandle();

    await openSwitch(page, "PT-BR");
    await expect(page).toHaveURL(/\/pt-br\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(PT_H1);
    await expect(page).toHaveTitle(/^Weider · Desenvolvedor web/);
    await expect(page.getByRole("link", { name: "Conheça meus projetos" })).toBeVisible();
    await expect(page.getByRole("link", { name: "PT-BR" })).toHaveAttribute("aria-current", "true");

    // Same document, same hero stage element: nothing was reloaded or remounted.
    expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);
    expect(await markBefore!.evaluate((el) => el.isConnected)).toBe(true);

    expect(await page.evaluate(() => localStorage.getItem("weider.locale"))).toBe("pt-br");

    // Back button returns to English text.
    await page.goBack();
    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(EN_H1);

    // Return visit to the root follows the saved choice.
    await page.goto("/");
    await expect(page).toHaveURL(/\/pt-br\/$/);

    expect(errors).toEqual([]);
  });
});

test.describe("navigation and content", () => {
  test("every in-page link has a target and external pages load", async ({ page, request }) => {
    await page.goto("/en/");
    const hrefs = await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    for (const href of hrefs) {
      if (href.startsWith("#")) {
        expect(await page.locator(href).count(), `target for ${href}`).toBe(1);
      } else if (href.startsWith("/")) {
        const res = await request.get(href);
        expect(res.status(), href).toBe(200);
      }
    }
  });

  test("seven areas are present and in order", async ({ page }) => {
    await page.goto("/en/");
    const ids = await page.locator("main > section").evaluateAll((s) => s.map((el) => el.id || "hero"));
    expect(ids).toEqual(["hero", "services", "work", "lab", "icf", "about", "contact"]);
    await expect(page.locator("header").first()).toBeVisible();
  });

  test("contact shows the honest pending note and no dead buttons", async ({ page }) => {
    await page.goto("/en/");
    const contact = page.locator("#contact");
    await expect(contact.getByRole("status")).toContainText("being set up");
    await expect(contact.locator("a")).toHaveCount(0);
  });

  test("project statuses are honest", async ({ page }) => {
    await page.goto("/en/");
    const work = page.locator("#work");
    await expect(work.getByText("In development")).toHaveCount(1);
    await expect(work.getByText("Planned")).toHaveCount(2);
    await expect(work.getByText("Live")).toHaveCount(0);
  });
});

test.describe("accessibility and layout", () => {
  test("first Tab reaches the skip link and it moves focus to main", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard check runs on desktop");
    await page.goto("/en/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("focus is visible on interactive elements", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard check runs on desktop");
    await page.goto("/en/");
    for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
    expect(outline).not.toBe("none");
  });

  test("mobile menu opens, traps Escape, and closes on link", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /Open menu|Close menu/ });
    await page.goto("/en/");
    if (!(await toggle.isVisible())) test.skip(true, "menu button only on narrow screens");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const panel = page.locator("#mobile-menu");
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await toggle.click();
    await panel.getByRole("link", { name: "Work" }).click();
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(/#work$/);
  });

  test("no horizontal overflow", async ({ page }) => {
    for (const path of ["/en/", "/pt-br/"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("reduced motion turns off entrance and pulse animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en/");
    const anim = await page.locator("figure img").evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe("none");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  });

  test("no console errors on either language", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/en/");
    await page.goto("/pt-br/");
    await page.goto("/lab/gravity/");
    expect(errors).toEqual([]);
  });

  test("full-page screenshots", async ({ page }, info) => {
    for (const path of ["/en/", "/pt-br/"]) {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await page.screenshot({ path: `test-results/shots/${info.project.name}${path.replaceAll("/", "_")}full.png`, fullPage: true });
    }
  });
});
