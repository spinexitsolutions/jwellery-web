"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import { useSite } from "./SiteProvider";

export function WhatsAppButton() {
  const { whatsappNumber, whatsappMessage } = useSite();
  if (!whatsappNumber) return null;
  const href = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-[75] grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 2, type: "spring" }}
      whileHover={{ scale: 1.08 }}
    >
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 1 1 8 4.42zm8.02-17.45A11.27 11.27 0 0 0 12.05.75 11.32 11.32 0 0 0 2.24 17.7L.75 23.25l5.68-1.49a11.3 11.3 0 0 0 5.61 1.43h.01A11.33 11.33 0 0 0 20.07 4.05z" />
      </svg>
    </motion.a>
  );
}

export function Analytics({ ga, gtm, pixel }: { ga: string; gtm: string; pixel: string }) {
  const pathname = usePathname();
  useEffect(() => {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };
    if (ga && w.gtag) w.gtag("config", ga, { page_path: pathname });
    if (pixel && w.fbq) w.fbq("track", "PageView");
  }, [pathname, ga, pixel]);
  return (
    <>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}</Script>
        </>
      )}
      {gtm && (
        <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}</Script>
      )}
      {pixel && (
        <Script id="fb-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script>
      )}
    </>
  );
}

/** Injects admin-provided HTML/scripts into head or body (scripts are re-created so they execute). */
export function CustomCode({ head, body }: { head: string; body: string }) {
  useEffect(() => {
    const inject = (html: string, target: HTMLElement) => {
      if (!html.trim()) return [] as Node[];
      const tpl = document.createElement("template");
      tpl.innerHTML = html;
      const nodes: Node[] = [];
      tpl.content.childNodes.forEach((node) => {
        if (node.nodeName === "SCRIPT") {
          const old = node as HTMLScriptElement;
          const s = document.createElement("script");
          Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
          s.text = old.text;
          target.appendChild(s);
          nodes.push(s);
        } else {
          const clone = node.cloneNode(true);
          target.appendChild(clone);
          nodes.push(clone);
        }
      });
      return nodes;
    };
    const added = [...inject(head, document.head), ...inject(body, document.body)];
    return () => added.forEach((n) => n.parentNode?.removeChild(n));
  }, [head, body]);
  return null;
}
