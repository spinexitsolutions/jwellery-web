"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Clock, Home, LocateFixed, MapPin, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, SafeImage, SplitText } from "./motion";

export type StoreView = { id: string; name: string; city: string; address: string; phone: string | null; email: string | null; hours: string | null; image: string | null; lat: number | null; lng: number | null; mapUrl: string | null; services: string[] };

function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function StoreLocator({ stores }: { stores: StoreView[] }) {
  const cities = useMemo(() => Array.from(new Set(stores.map((s) => s.city))), [stores]);
  const [city, setCity] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(stores[0]?.id ?? null);
  const [me, setMe] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  const list = useMemo(() => {
    let l = city ? stores.filter((s) => s.city === city) : stores;
    if (me) l = [...l].sort((a, b) => (a.lat && a.lng ? distanceKm(me, [a.lat, a.lng]) : 1e9) - (b.lat && b.lng ? distanceKm(me, [b.lat, b.lng]) : 1e9));
    return l;
  }, [stores, city, me]);
  const current = stores.find((s) => s.id === selected) ?? list[0];
  const mapSrc = current ? (current.lat && current.lng ? `https://www.google.com/maps?q=${current.lat},${current.lng}&z=15&output=embed` : `https://www.google.com/maps?q=${encodeURIComponent(`${current.name}, ${current.address}`)}&output=embed`) : "";

  return (
    <div className="site-container pb-28 pt-36 md:pt-44">
      <p className="eyebrow">Boutiques</p>
      <SplitText as="h1" immediate text="Come *see* them" className="display mt-5 block text-[clamp(3.2rem,9vw,8rem)] leading-[0.9]" />
      <Reveal delay={0.2}>
        <p className="mt-6 max-w-xl text-muted">Every boutique has a private salon. Book ahead and we&apos;ll have pieces from the vault waiting for you.</p>
      </Reveal>

      <div className="mt-12 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em]">
        <button onClick={() => setCity(null)} className={cn("rounded-full border px-4 py-2", !city ? "border-fg bg-fg text-bg" : "border-line")}>
          All cities
        </button>
        {cities.map((c) => (
          <button key={c} onClick={() => setCity(c)} className={cn("rounded-full border px-4 py-2", city === c ? "border-fg bg-fg text-bg" : "border-line")}>
            {c}
          </button>
        ))}
        <button
          onClick={() => {
            if (!navigator.geolocation) return;
            setLocating(true);
            navigator.geolocation.getCurrentPosition(
              (p) => {
                setMe([p.coords.latitude, p.coords.longitude]);
                setLocating(false);
              },
              () => setLocating(false),
            );
          }}
          className="ml-auto flex items-center gap-2 rounded-full border border-line px-4 py-2 hover:border-fg"
        >
          <LocateFixed size={13} /> {locating ? "Locating…" : "Nearest to me"}
        </button>
      </div>

      {stores.length === 0 ? (
        <p className="mt-16 text-muted">Boutique details are coming soon.</p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <ul className="space-y-3 lg:col-span-5">
            {list.map((s) => (
              <li key={s.id}>
                <button onClick={() => setSelected(s.id)} className={cn("w-full rounded-[var(--radius)] border p-5 text-left transition", current?.id === s.id ? "border-fg bg-surface" : "border-line hover:border-muted")}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{s.city}</p>
                      <p className="display mt-1 text-3xl">{s.name}</p>
                    </div>
                    {me && s.lat && s.lng && <span className="text-xs text-muted">{distanceKm(me, [s.lat, s.lng]).toFixed(0)} km</span>}
                  </div>
                  <p className="mt-3 flex gap-2 text-sm text-muted">
                    <MapPin size={14} className="mt-0.5 shrink-0" /> {s.address}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-muted">
                    {s.services.includes("tryathome") && (
                      <span className="flex items-center gap-1 rounded-full bg-bg px-2 py-1">
                        <Home size={11} /> Try at home
                      </span>
                    )}
                    {s.services.includes("video") && (
                      <span className="flex items-center gap-1 rounded-full bg-bg px-2 py-1">
                        <Video size={11} /> Video call
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {current && (
                <motion.div key={current.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="lg:sticky lg:top-32">
                  <div className="overflow-hidden rounded-[var(--radius)] border border-line">
                    {current.image && <SafeImage src={current.image} alt={current.name} className="aspect-[16/7] w-full object-cover" />}
                    <iframe src={mapSrc} title={`Map to ${current.name}`} className="h-[320px] w-full grayscale-[0.4]" loading="lazy" />
                  </div>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2 text-sm">
                      {current.hours && (
                        <p className="flex items-center gap-2">
                          <Clock size={14} className="text-accent" /> {current.hours}
                        </p>
                      )}
                      {current.phone && (
                        <a href={`tel:${current.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:underline">
                          <Phone size={14} className="text-accent" /> {current.phone}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 sm:justify-end">
                      <a href={current.mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(current.lat && current.lng ? `${current.lat},${current.lng}` : `${current.name}, ${current.address}`)}`} target="_blank" rel="noreferrer" className="btn btn-ghost">
                        Directions
                      </a>
                      <Link href={`/book?type=store&store=${current.id}`} className="btn btn-primary">
                        Book a visit
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
