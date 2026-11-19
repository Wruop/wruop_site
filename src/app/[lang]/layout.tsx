import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono, Spectral } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/components/LocaleProvider";
import { getDictionary } from "@/i18n";
import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { siteUrl } from "@/content/site";
import "../globals.css";

// Editorial display face for headlines; Hanken Grotesk for interface and body; IBM Plex Mono for technical labels.
const display = Spectral({ subsets: ["latin", "latin-ext"], weight: ["300", "400"], variable: "--font-display", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type Props = { children: ReactNode; params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(siteUrl),
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `/${lang}/`,
      languages: { en: "/en/", "pt-BR": "/pt-br/", "x-default": "/en/" },
    },
    openGraph: {
      type: "website",
      url: `/${lang}/`,
      siteName: "Weider · W.",
      title: t.meta.title,
      description: t.meta.description,
      locale: lang === "en" ? "en_US" : "pt_BR",
      alternateLocale: lang === "en" ? ["pt_BR"] : ["en_US"],
      images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    twitter: { card: "summary_large_image", title: t.meta.title, description: t.meta.description, images: ["/brand/og.png"] },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/brand/icon-192.png", type: "image/png", sizes: "192x192" },
      ],
      apple: "/brand/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#111315",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;
  return (
    <html lang={htmlLang[locale]} className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
