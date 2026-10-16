"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, ExternalLink, Search, Star } from "lucide-react";
import { bulkProducts, duplicateProduct } from "@/app/admin/actions";
import { formatPrice } from "@/lib/utils";
import { Badge, Button, EmptyState, Input, LinkButton, Select, useAction } from "./ui";

type Row = { id: string; name: string; slug: string; sku: string | null; price: number; stock: number; featured: boolean; published: boolean; image: string; collection: string };

export function ProductsTable({ products, currency }: { products: Row[]; currency: string }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo(
    () =>
      products.filter((p) => {
        if (q && !`${p.name} ${p.sku} ${p.collection}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (status === "published" && !p.published) return false;
        if (status === "draft" && p.published) return false;
        if (status === "featured" && !p.featured) return false;
        if (status === "low" && p.stock > 2) return false;
        return true;
      }),
    [products, q, status],
  );

  const bulk = async (action: Parameters<typeof bulkProducts>[1]) => {
    if (action === "delete" && !confirm(`Delete ${selected.length} product(s)?`)) return;
    await run(() => bulkProducts(selected, action), "Updated");
    setSelected([]);
    router.refresh();
  };

  if (products.length === 0) return <EmptyState title="No products yet" description="Add your first piece to start selling." action={<LinkButton href="/admin/products/new">Add product</LinkButton>} />;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-100 p-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, SKU or collection" className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="md:w-44">
          <option value="">All products</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="featured">Featured</option>
          <option value="low">Low stock (≤2)</option>
        </Select>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-2 text-sm">
          <span className="mr-2 font-medium">{selected.length} selected</span>
          <Button size="sm" variant="secondary" loading={pending} onClick={() => bulk("publish")}>
            Publish
          </Button>
          <Button size="sm" variant="secondary" onClick={() => bulk("unpublish")}>
            Unpublish
          </Button>
          <Button size="sm" variant="secondary" onClick={() => bulk("feature")}>
            Feature
          </Button>
          <Button size="sm" variant="secondary" onClick={() => bulk("unfeature")}>
            Unfeature
          </Button>
          <Button size="sm" variant="danger" onClick={() => bulk("delete")}>
            Delete
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-500">
            <tr className="border-b border-zinc-100">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} />
              </th>
              <th className="px-2 py-3 font-medium">Product</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Collection</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50/60">
                <td className="px-4 py-2.5">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, p.id] : selected.filter((x) => x !== p.id))} />
                </td>
                <td className="px-2 py-2.5">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}
                    </span>
                    <span>
                      <span className="flex items-center gap-1.5 font-medium hover:underline">
                        {p.name} {p.featured && <Star size={12} className="fill-amber-400 text-amber-400" />}
                      </span>
                      <span className="text-xs text-zinc-500">{p.sku}</span>
                    </span>
                  </Link>
                </td>
                <td className="hidden px-4 py-2.5 text-zinc-600 md:table-cell">{p.collection || "—"}</td>
                <td className="px-4 py-2.5 tabular-nums">{formatPrice(p.price, currency)}</td>
                <td className="hidden px-4 py-2.5 sm:table-cell">
                  <span className={p.stock <= 0 ? "text-rose-600" : p.stock <= 2 ? "text-amber-600" : "text-zinc-600"}>{p.stock}</span>
                </td>
                <td className="px-4 py-2.5">{p.published ? <Badge tone="green">Live</Badge> : <Badge>Draft</Badge>}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <a href={`/shop/${p.slug}`} target="_blank" className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800" title="View">
                      <ExternalLink size={14} />
                    </a>
                    <button
                      className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"
                      title="Duplicate"
                      onClick={async () => {
                        const r = await run(() => duplicateProduct(p.id), "Duplicated");
                        if (r && "data" in r && r.data) router.push(`/admin/products/${r.data.id}`);
                      }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="py-10 text-center text-sm text-zinc-500">No products match your filters.</p>}
    </div>
  );
}
