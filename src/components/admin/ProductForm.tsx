"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { bulkProducts, saveProduct, type ProductInput } from "@/app/admin/actions";
import { slugify } from "@/lib/utils";
import { ImagesField } from "./fields";
import { Button, Card, Input, Label, PageTitle, Select, Textarea, Toggle, useAction } from "./ui";

const EMPTY: ProductInput = {
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  price: 0,
  compareAtPrice: null,
  images: [],
  metal: "",
  purity: "",
  gemstone: "",
  weight: "",
  details: [
    { label: "Metal", value: "" },
    { label: "Stone", value: "" },
    { label: "Certification", value: "BIS Hallmark" },
  ],
  tags: "",
  stock: 1,
  featured: false,
  published: true,
  sortOrder: 0,
  collectionId: "",
};

export function ProductForm({ id, initial, collections }: { id: string | null; initial?: ProductInput; collections: { id: string; name: string }[] }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [v, setV] = useState<ProductInput>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const set = <K extends keyof ProductInput>(k: K, val: ProductInput[K]) => setV((p) => ({ ...p, [k]: val }));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await run(() => saveProduct(id, v), "Product saved");
        if (r && "data" in r && r.data && !id) router.replace(`/admin/products/${r.data.id}`);
        else router.refresh();
      }}
    >
      <PageTitle
        title={id ? v.name || "Edit product" : "New product"}
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          <>
            {id && (
              <>
                <a href={`/shop/${v.slug}`} target="_blank" className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm hover:bg-zinc-50">
                  View on site
                </a>
                <Button
                  type="button"
                  variant="danger"
                  onClick={async () => {
                    if (!confirm("Delete this product?")) return;
                    await run(() => bulkProducts([id], "delete"), "Deleted");
                    router.push("/admin/products");
                  }}
                >
                  Delete
                </Button>
              </>
            )}
            <Button loading={pending}>Save product</Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Basics">
            <div className="space-y-5">
              <div>
                <Label>Name</Label>
                <Input
                  required
                  value={v.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value));
                  }}
                  placeholder="e.g. Ember Solitaire Ring"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>URL slug</Label>
                  <Input
                    value={v.slug ?? ""}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", e.target.value);
                    }}
                  />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input value={v.sku ?? ""} onChange={(e) => set("sku", e.target.value)} />
                </div>
              </div>
              <div>
                <Label help="One line shown near the price.">Short description</Label>
                <Input value={v.shortDescription ?? ""} onChange={(e) => set("shortDescription", e.target.value)} />
              </div>
              <div>
                <Label help="Markdown supported: **bold**, - lists, ## headings">Full description</Label>
                <Textarea rows={8} value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} />
              </div>
            </div>
          </Card>

          <Card title="Images" description="The first image is the cover; the second appears on hover.">
            <ImagesField value={v.images} onChange={(imgs) => set("images", imgs)} />
          </Card>

          <Card title="Specifications">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Metal</Label>
                <Input value={v.metal ?? ""} onChange={(e) => set("metal", e.target.value)} placeholder="18K Yellow Gold" />
              </div>
              <div>
                <Label>Purity</Label>
                <Input value={v.purity ?? ""} onChange={(e) => set("purity", e.target.value)} placeholder="18K / 22K / PT950" />
              </div>
              <div>
                <Label>Gemstone</Label>
                <Input value={v.gemstone ?? ""} onChange={(e) => set("gemstone", e.target.value)} placeholder="Diamond 1.02ct" />
              </div>
              <div>
                <Label>Weight</Label>
                <Input value={v.weight ?? ""} onChange={(e) => set("weight", e.target.value)} placeholder="4.2 g" />
              </div>
            </div>
            <div className="mt-6">
              <Label help="Shown in the Details tab on the product page.">Detail rows</Label>
              <div className="space-y-2">
                {v.details.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={d.label} placeholder="Label" onChange={(e) => set("details", v.details.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} className="w-1/3" />
                    <Input value={d.value} placeholder="Value" onChange={(e) => set("details", v.details.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
                    <Button type="button" variant="ghost" onClick={() => set("details", v.details.filter((_, k) => k !== i))}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="secondary" onClick={() => set("details", [...v.details, { label: "", value: "" }])}>
                  <Plus size={13} /> Add row
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <div className="space-y-4">
              <Toggle label="Published" help="Visible in the shop" checked={v.published} onChange={(x) => set("published", x)} />
              <Toggle label="Featured" help="Shown in 'featured' product sections" checked={v.featured} onChange={(x) => set("featured", x)} />
            </div>
          </Card>
          <Card title="Pricing & stock">
            <div className="space-y-4">
              <div>
                <Label>Price</Label>
                <Input type="number" min={0} step="any" required value={v.price} onChange={(e) => set("price", Number(e.target.value))} />
              </div>
              <div>
                <Label help="Shows as struck-through original price.">Compare-at price</Label>
                <Input type="number" min={0} step="any" value={v.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div>
                <Label help="At 0 the piece shows as 'made to order'.">Stock</Label>
                <Input type="number" value={v.stock} onChange={(e) => set("stock", Number(e.target.value))} />
              </div>
            </div>
          </Card>
          <Card title="Organisation">
            <div className="space-y-4">
              <div>
                <Label>Collection</Label>
                <Select value={v.collectionId ?? ""} onChange={(e) => set("collectionId", e.target.value)}>
                  <option value="">— None —</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label help="Comma separated, used by search.">Tags</Label>
                <Input value={v.tags ?? ""} onChange={(e) => set("tags", e.target.value)} placeholder="ring, solitaire, bridal" />
              </div>
              <div>
                <Label help="Lower numbers appear first.">Sort order</Label>
                <Input type="number" value={v.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
