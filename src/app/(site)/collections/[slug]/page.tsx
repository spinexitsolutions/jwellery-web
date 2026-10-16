import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/site/ProductCard";
import { ParallaxImage, Reveal, SplitText } from "@/components/site/motion";
import { db } from "@/lib/db";
import { toProductView } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await db.collection.findUnique({ where: { slug } });
  return c ? { title: c.name, description: c.description || undefined } : {};
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const c = await db.collection.findUnique({ where: { slug }, include: { products: { where: { published: true }, orderBy: { sortOrder: "asc" } } } });
  if (!c) notFound();
  return (
    <div className="pb-28">
      <div className="relative h-[85svh] min-h-[560px] overflow-hidden text-white">
        <ParallaxImage src={c.image || ""} alt={c.name} reveal={false} strength={18} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
        <div className="site-container relative flex h-full flex-col justify-end pb-14">
          <p className="eyebrow !text-white/70">{c.tagline}</p>
          <SplitText as="h1" immediate text={c.name} mode="chars" className="display mt-4 block text-[clamp(4rem,14vw,14rem)] leading-[0.85]" />
        </div>
      </div>
      <div className="site-container grid gap-8 py-20 md:grid-cols-12">
        <Reveal className="md:col-span-3">
          <p className="eyebrow">{c.products.length} pieces</p>
        </Reveal>
        <Reveal className="md:col-span-8" delay={0.1}>
          <p className="display text-[clamp(1.8rem,3.4vw,3.2rem)] leading-[1.15]">{c.description}</p>
        </Reveal>
      </div>
      <div className="site-container grid grid-cols-2 gap-x-4 gap-y-14 md:gap-x-6 lg:grid-cols-3">
        {c.products.map((p, i) => (
          <ProductCard key={p.id} product={toProductView({ ...p, collection: c })} index={i} size="lg" />
        ))}
      </div>
    </div>
  );
}
