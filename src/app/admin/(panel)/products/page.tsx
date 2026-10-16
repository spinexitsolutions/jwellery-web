import { ProductsTable } from "@/components/admin/ProductsTable";
import { LinkButton, PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { parseJSON } from "@/lib/utils";

export default async function Products() {
  const [products, site] = await Promise.all([db.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], include: { collection: true } }), getSetting("site")]);
  return (
    <>
      <PageTitle title="Products" description={`${products.length} pieces in your catalogue`} actions={<LinkButton href="/admin/products/new">+ Add product</LinkButton>} />
      <ProductsTable
        currency={site.currency}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          price: p.price,
          stock: p.stock,
          featured: p.featured,
          published: p.published,
          image: parseJSON<string[]>(p.images, [])[0] ?? "",
          collection: p.collection?.name ?? "",
        }))}
      />
    </>
  );
}
