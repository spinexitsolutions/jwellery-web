import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetail } from "@/components/site/ProductDetail";
import { ProductCard } from "@/components/site/ProductCard";
import { db } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { toProductView } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await db.product.findUnique({ where: { slug } });
  if (!p) return {};
  const images = toProductView(p).images;
  return { title: p.name, description: p.shortDescription || undefined, openGraph: { images: images.slice(0, 1) } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const row = await db.product.findUnique({ where: { slug }, include: { collection: true } });
  if (!row || !row.published) notFound();
  const product = toProductView(row);
  const related = await db.product.findMany({
    where: { published: true, id: { not: row.id }, ...(row.collectionId ? { collectionId: row.collectionId } : {}) },
    take: 4,
    include: { collection: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <>
      <ProductDetail product={product} descriptionHtml={renderMarkdown(row.description)} />
      {related.length > 0 && (
        <section className="site-container border-t border-line py-24">
          <p className="eyebrow">You may also love</p>
          <h2 className="display mt-4 text-[clamp(2.4rem,5vw,4.5rem)]">
            From <em className="accent-word">{row.collection?.name ?? "the atelier"}</em>
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={toProductView(p)} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
