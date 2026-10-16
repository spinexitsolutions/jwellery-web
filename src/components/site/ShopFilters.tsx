"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const METALS = ["Yellow Gold", "Rose Gold", "White Gold", "22K Gold", "Platinum"];

export function ShopFilters({ collections }: { collections: { name: string; slug: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const active = params.get("collection");
  return (
    <div className="sticky top-[100px] z-30 my-12 flex flex-col gap-4 border-y border-line bg-bg/85 py-4 backdrop-blur-xl md:top-[106px] md:flex-row md:items-center md:justify-between">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 text-[11px] uppercase tracking-[0.16em] md:pb-0">
        <button onClick={() => set("collection", null)} className={cn("shrink-0 rounded-full border px-4 py-2 transition", !active ? "border-fg bg-fg text-bg" : "border-line hover:border-fg")}>
          All
        </button>
        {collections.map((c) => (
          <button
            key={c.slug}
            onClick={() => set("collection", c.slug)}
            className={cn("shrink-0 rounded-full border px-4 py-2 transition", active === c.slug ? "border-fg bg-fg text-bg" : "border-line hover:border-fg")}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="flex gap-3 text-[11px] uppercase tracking-[0.14em]">
        <select value={params.get("metal") || ""} onChange={(e) => set("metal", e.target.value || null)} className="rounded-full border border-line bg-transparent px-4 py-2 uppercase outline-none">
          <option value="">Any metal</option>
          {METALS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select value={params.get("sort") || ""} onChange={(e) => set("sort", e.target.value || null)} className="rounded-full border border-line bg-transparent px-4 py-2 uppercase outline-none">
          <option value="">Curated</option>
          <option value="new">Newest</option>
          <option value="price-asc">Price — low to high</option>
          <option value="price-desc">Price — high to low</option>
        </select>
      </div>
    </div>
  );
}
