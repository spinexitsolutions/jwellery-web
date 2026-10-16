import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductDetail } from "@/components/site/ProductDetail";
import { getPricingContext, viewProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { getSetting } from "@/lib/settings";
import { toProductView } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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
  const [ctx, commerce, site, reviewRows, relatedRows] = await Promise.all([
    getPricingContext(),
    getSetting("commerce"),
    getSetting("site"),
    db.review.findMany({ where: { productId: row.id, status: "approved" }, orderBy: { createdAt: "desc" } }),
    db.product.findMany({
      where: { published: true, id: { not: row.id }, ...(row.collectionId ? { collectionId: row.collectionId } : {}) },
      take: 4,
      include: { collection: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const product = toProductView(row, ctx);
  const related = await viewProducts(relatedRows, ctx);
  const count = reviewRows.length;
  const avg = count ? reviewRows.reduce((a, r) => a + r.rating, 0) / count : 0;
  const distribution = [1, 2, 3, 4, 5].map((n) => reviewRows.filter((r) => r.rating === n).length);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.shortDescription || undefined,
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: site.brandName },
    offers: { "@type": "Offer", priceCurrency: site.currency, price: product.price, availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/PreOrder" },
    ...(count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Math.round(avg * 10) / 10, reviewCount: count } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductDetail
        product={product}
        descriptionHtml={renderMarkdown(row.description)}
        rates={ctx.rates}
        commerce={{
          gstPercent: commerce.gstPercent,
          emiEnabled: commerce.emiEnabled,
          emiMinAmount: commerce.emiMinAmount,
          emiMonths: commerce.emiMonths,
          emiInterestPercent: commerce.emiInterestPercent,
          tryAtHomeEnabled: commerce.tryAtHomeEnabled,
          videoConsultEnabled: commerce.videoConsultEnabled,
          returnWindowDays: commerce.returnWindowDays,
        }}
        reviews={{
          avg,
          count,
          distribution,
          items: reviewRows.map((r) => ({ id: r.id, name: r.name, rating: r.rating, title: r.title, body: r.body, verified: r.verified, date: formatDate(r.createdAt) })),
        }}
      />
      {related.length > 0 && (
        <section className="site-container border-t border-line py-24">
          <p className="eyebrow">You may also love</p>
          <h2 className="display mt-4 text-[clamp(2.4rem,5vw,4.5rem)]">
            From <em className="accent-word">{row.collection?.name ?? "the atelier"}</em>
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
