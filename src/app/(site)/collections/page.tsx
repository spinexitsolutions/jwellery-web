import type { Metadata } from "next";
import Link from "next/link";
import { ParallaxImage, Reveal, SplitText } from "@/components/site/motion";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const collections = await db.collection.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <div className="pb-24 pt-36 md:pt-44">
      <div className="site-container">
        <p className="eyebrow">Collections</p>
        <SplitText as="h1" immediate text="Worlds, *in miniature*" className="display mt-5 block text-[clamp(3.4rem,10vw,10rem)] leading-[0.88]" />
      </div>
      <div className="mt-20 space-y-24 md:space-y-40">
        {collections.map((c, i) => (
          <Link key={c.id} href={`/collections/${c.slug}`} className="site-container group grid items-center gap-8 md:grid-cols-12" data-cursor="Explore">
            <div className={i % 2 ? "md:order-2 md:col-span-7 md:col-start-6" : "md:col-span-7"}>
              <ParallaxImage src={c.image || ""} alt={c.name} className="aspect-[16/11] w-full rounded-[var(--radius)]" />
            </div>
            <Reveal className={i % 2 ? "md:order-1 md:col-span-4" : "md:col-span-4 md:col-start-9"}>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                Nº {String(i + 1).padStart(2, "0")} · {c._count.products} pieces
              </p>
              <h2 className="display mt-4 text-[clamp(3rem,6vw,6.5rem)] leading-none transition-colors group-hover:text-accent">{c.name}</h2>
              <p className="mt-2 italic text-muted">{c.tagline}</p>
              <p className="mt-6 max-w-sm leading-relaxed text-muted">{c.description}</p>
              <span className="link-underline mt-8 inline-block text-[12px] uppercase tracking-[0.16em]">Discover →</span>
            </Reveal>
          </Link>
        ))}
      </div>
    </div>
  );
}
