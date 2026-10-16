import { CartProvider } from "@/components/site/Cart";
import { Cursor } from "@/components/site/Cursor";
import { Analytics, CustomCode, WhatsAppButton } from "@/components/site/Extras";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { Preloader } from "@/components/site/Preloader";
import { SiteProvider, type PublicConfig } from "@/components/site/SiteProvider";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { getRates } from "@/lib/rates";
import { getAllSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ site, theme, navigation, integrations }, rates] = await Promise.all([getAllSettings(), getRates()]);

  const config: PublicConfig = {
    brandName: site.brandName,
    tagline: site.tagline,
    logoUrl: site.logoUrl,
    currency: site.currency,
    locale: site.locale,
    email: site.email,
    phone: site.phone,
    address: site.address,
    hours: site.hours,
    codEnabled: site.codEnabled,
    shippingFlat: site.shippingFlat,
    freeShippingAbove: site.freeShippingAbove,
    razorpayEnabled: integrations.razorpayEnabled && !!integrations.razorpayKeyId && !!integrations.razorpayKeySecret,
    razorpayKeyId: integrations.razorpayKeyId,
    whatsappNumber: integrations.whatsappNumber,
    whatsappMessage: integrations.whatsappMessage,
    animations: theme.animations,
    smoothScroll: theme.smoothScroll,
    customCursor: theme.customCursor,
    enable3D: theme.enable3D,
    preloader: theme.preloader,
    headerStyle: theme.headerStyle,
    colors: theme.colors,
  };

  const ticker = [...rates.map((r) => `${r.label} ${r.value}`), ...(site.announcement ? [site.announcement] : [])];

  return (
    <SiteProvider value={config}>
      <SmoothScroll enabled={theme.animations && theme.smoothScroll}>
        <CartProvider>
          <div className={cn("min-h-screen", theme.grain && "grain", !theme.animations && "no-anim")}>
            {theme.preloader && theme.animations && <Preloader brand={site.brandName} />}
            <Header links={navigation.header} ticker={ticker} />
            <main>{children}</main>
            <Footer nav={navigation.footer} socials={site.socials} note={site.footerNote} />
            <WhatsAppButton />
            {theme.customCursor && theme.animations && <Cursor />}
          </div>
        </CartProvider>
      </SmoothScroll>
      <Analytics ga={integrations.googleAnalyticsId} gtm={integrations.gtmId} pixel={integrations.metaPixelId} />
      <CustomCode head={integrations.customHead} body={integrations.customBody} />
    </SiteProvider>
  );
}
