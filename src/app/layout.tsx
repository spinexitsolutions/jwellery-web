import type { Metadata } from "next";
import "./globals.css";
import { getSetting } from "@/lib/settings";
import { googleFontsHref, themeToCss } from "@/lib/theme";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSetting("site");
  return {
    title: { default: site.seoTitle || site.brandName, template: `%s — ${site.brandName}` },
    description: site.seoDescription,
    icons: site.faviconUrl ? { icon: site.faviconUrl } : undefined,
    openGraph: { title: site.seoTitle || site.brandName, description: site.seoDescription, images: site.ogImage ? [site.ogImage] : undefined },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getSetting("theme");
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={googleFontsHref(theme)} />
        <style id="theme-vars" dangerouslySetInnerHTML={{ __html: themeToCss(theme) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
