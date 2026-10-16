import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { db } from "@/lib/db";
import { DEFAULT_PRICING, parsePricing } from "@/lib/pricing";
import { getMetalRates } from "@/lib/rates";
import { getSetting } from "@/lib/settings";
import { parseJSON } from "@/lib/utils";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [collections, rates, commerce] = await Promise.all([db.collection.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }), getMetalRates(), getSetting("commerce")]);
  const env = { rates, gstPercent: commerce.gstPercent, ringSizes: commerce.ringSizes };
  if (id === "new") return <ProductForm id={null} collections={collections} env={env} />;
  const p = await db.product.findUnique({ where: { id } });
  if (!p) notFound();
  return (
    <ProductForm
      id={p.id}
      collections={collections}
      env={env}
      initial={{
        name: p.name,
        slug: p.slug,
        sku: p.sku ?? "",
        shortDescription: p.shortDescription ?? "",
        description: p.description ?? "",
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        images: parseJSON<string[]>(p.images, []),
        metal: p.metal ?? "",
        purity: p.purity ?? "",
        gemstone: p.gemstone ?? "",
        weight: p.weight ?? "",
        details: parseJSON<{ label: string; value: string }[]>(p.details, []),
        tags: p.tags ?? "",
        stock: p.stock,
        featured: p.featured,
        published: p.published,
        sortOrder: p.sortOrder,
        collectionId: p.collectionId ?? "",
        pricing: { ...DEFAULT_PRICING, ...parsePricing(p.pricing) },
        certificateLab: p.certificateLab ?? "",
        certificateNo: p.certificateNo ?? "",
        certificateUrl: p.certificateUrl ?? "",
        huid: p.huid ?? "",
        hsnCode: p.hsnCode ?? "7113",
        tryAtHome: p.tryAtHome,
      }}
    />
  );
}
