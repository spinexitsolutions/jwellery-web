import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { ShopFilters } from "@/components/site/ShopFilters";
import { ProductCard } from "@/components/site/ProductCard";
import { SplitText } from "@/components/site/motion";
import { db } from "@/lib/db";
import { toProductView } from "@/lib/types";

export const metadata: Metadata = { title: "Shop" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function Shop({ searchParams }: Props) {
  const sp = await searchParams;
  const where: Prisma.ProductWhereInput = { published: true };
  if (sp.collection) where.collection = { slug: sp.collection };
  if (sp.metal) where.metal = { contains: sp.metal };
  if (sp.q) {
    where.OR = [{ name: { contains: sp.q } }, { description: { contains: sp.q } }, { gemstone: { contains: sp.q } }, { tags: { contains: sp.q } }, { metal: { contains: sp.q } }];
  }
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sp.sort === "price-asc" ? { price: "asc" } : sp.sort === "price-desc" ? { price: "desc" } : sp.sort === "new" ? { createdAt: "desc" } : sp.sort === "featured" ? { featured: "desc" } : { sortOrder: "asc" };

  const [products, collections] = await Promise.all([
    db.product.findMany({ where, orderBy, include: { collection: true } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
  ]);

  return (
    <div className="site-container pb-32 pt-36 md:pt-44">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">{sp.q ? `Results for “${sp.q}”` : "The collection"}</p>
          <SplitText as="h1" immediate text="All *jewellery*" className="display mt-5 block text-[clamp(3.4rem,10vw,10rem)] leading-[0.88]" />
        </div>
        <p className="text-sm text-muted">{products.length} pieces</p>
      </div>
      <ShopFilters collections={collections} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-14 md:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={toProductView(p)} index={i} />
        ))}
      </div>
      {products.length === 0 && (
        <div className="py-32 text-center">
          <p className="display text-5xl">Nothing here, yet.</p>
          <p className="mt-4 text-muted">Try a different filter or search.</p>
        </div>
      )}
    </div>
  );
}
