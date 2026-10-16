import { CollectionsManager } from "@/components/admin/CollectionsManager";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function Collections() {
  const rows = await db.collection.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <>
      <PageTitle title="Collections" description="Group products into collections — each gets its own page." />
      <CollectionsManager
        collections={rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, tagline: c.tagline ?? "", description: c.description ?? "", image: c.image ?? "", featured: c.featured, sortOrder: c.sortOrder, count: c._count.products }))}
      />
    </>
  );
}
