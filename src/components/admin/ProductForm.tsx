"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { bulkProducts, saveProduct, type ProductInput } from "@/app/admin/actions";
import { computePrice, DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";
import type { MetalRate } from "@/lib/settings-types";
import { formatPrice, slugify } from "@/lib/utils";
import { ImagesField, MediaPicker } from "./fields";
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
  pricing: DEFAULT_PRICING,
  certificateLab: "",
  certificateNo: "",
  certificateUrl: "",
  huid: "",
  hsnCode: "7113",
  tryAtHome: true,
};

type Env = { rates: MetalRate[]; gstPercent: number; ringSizes: string[] };

export function ProductForm({ id, initial, collections, env }: { id: string | null; initial?: ProductInput; collections: { id: string; name: string }[]; env: Env }) {
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

          <PricingCard value={v.pricing} basePrice={v.price} env={env} onChange={(pricing) => set("pricing", pricing)} />

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
                <Label help={v.pricing.mode === "rate" ? "Ignored — calculated live from metal rates." : "GST inclusive base price."}>Price</Label>
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
          <Card title="Certification & hallmark" description="Shown on the product page with verify links.">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Lab</Label>
                  <Select value={v.certificateLab ?? ""} onChange={(e) => set("certificateLab", e.target.value)}>
                    <option value="">—</option>
                    <option>IGI</option>
                    <option>GIA</option>
                    <option>SGL</option>
                    <option>HRD</option>
                    <option>GII</option>
                  </Select>
                </div>
                <div>
                  <Label>Report no.</Label>
                  <Input value={v.certificateNo ?? ""} onChange={(e) => set("certificateNo", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Certificate file (PDF / image)</Label>
                <FileField value={v.certificateUrl ?? ""} onChange={(x) => set("certificateUrl", x)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label help="6-character BIS code">HUID</Label>
                  <Input value={v.huid ?? ""} maxLength={6} onChange={(e) => set("huid", e.target.value.toUpperCase())} className="font-mono uppercase" />
                </div>
                <div>
                  <Label>HSN code</Label>
                  <Input value={v.hsnCode ?? ""} onChange={(e) => set("hsnCode", e.target.value)} />
                </div>
              </div>
              <Toggle label="Offer try-at-home & video call" checked={v.tryAtHome} onChange={(x) => set("tryAtHome", x)} />
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

function FileField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/certificate.pdf" />
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          <FileText size={14} />
        </Button>
      </div>
      {value && (
        <a href={value} target="_blank" className="text-xs text-zinc-500 underline">
          Open file
        </a>
      )}
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={onChange} />
    </div>
  );
}

function PricingCard({ value, onChange, basePrice, env }: { value: PricingConfig; onChange: (v: PricingConfig) => void; basePrice: number; env: Env }) {
  const set = <K extends keyof PricingConfig>(k: K, x: PricingConfig[K]) => onChange({ ...value, [k]: x });
  const rateMap = Object.fromEntries(env.rates.map((r) => [r.key, r.perGram]));
  const preview = computePrice(basePrice, value, rateMap, {}, env.gstPercent);
  const fmt = (n: number) => formatPrice(n, "INR");
  return (
    <Card title="Pricing & variants" description="Fixed price with optional variant surcharges, or live pricing from today's metal rates.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 text-sm">
          {(
            [
              ["fixed", "Fixed price"],
              ["rate", "Live metal rate"],
            ] as const
          ).map(([k, l]) => (
            <button type="button" key={k} onClick={() => set("mode", k)} className={`rounded-lg py-2 font-medium transition ${value.mode === k ? "bg-white shadow-sm" : "text-zinc-500"}`}>
              {l}
            </button>
          ))}
        </div>

        {value.mode === "rate" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label help="Net metal weight in grams">Metal weight (g)</Label>
              <Input type="number" step="any" min={0} value={value.metalWeight} onChange={(e) => set("metalWeight", Number(e.target.value))} />
            </div>
            <div>
              <Label help="Used when no diamond-quality options are set">Stone value (₹)</Label>
              <Input type="number" min={0} value={value.stoneValue} onChange={(e) => set("stoneValue", Number(e.target.value))} />
            </div>
            <div>
              <Label>Making charges</Label>
              <Select value={value.makingType} onChange={(e) => set("makingType", e.target.value as PricingConfig["makingType"])}>
                <option value="percent">% of metal value</option>
                <option value="perGram">₹ per gram</option>
                <option value="flat">Flat ₹</option>
              </Select>
            </div>
            <div>
              <Label>{value.makingType === "percent" ? "Making %" : "Making amount (₹)"}</Label>
              <Input type="number" step="any" min={0} value={value.makingValue} onChange={(e) => set("makingValue", Number(e.target.value))} />
            </div>
          </div>
        )}

        <div>
          <Label help={value.mode === "rate" ? "Each metal option uses its own per-gram rate." : "Surcharge (₹) added to the base price; can be negative."}>Metal options</Label>
          <div className="space-y-2">
            {value.metals.map((m, i) => (
              <div key={i} className="flex gap-2">
                <Input value={m.label} placeholder="18K Yellow Gold" onChange={(e) => set("metals", value.metals.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                <Select value={m.rateKey} onChange={(e) => set("metals", value.metals.map((x, k) => (k === i ? { ...x, rateKey: e.target.value } : x)))} className="w-40">
                  {env.rates.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </Select>
                {value.mode === "fixed" && <Input type="number" value={m.delta} placeholder="+₹" onChange={(e) => set("metals", value.metals.map((x, k) => (k === i ? { ...x, delta: Number(e.target.value) } : x)))} className="w-32" />}
                <Button type="button" variant="ghost" onClick={() => set("metals", value.metals.filter((_, k) => k !== i))}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => set("metals", [...value.metals, { label: "", rateKey: env.rates[0]?.key ?? "gold22", delta: 0 }])}>
                <Plus size={13} /> Add metal
              </Button>
              {value.metals.length === 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    set("metals", [
                      { label: "18K Yellow Gold", rateKey: "gold18", delta: 0 },
                      { label: "18K Rose Gold", rateKey: "gold18", delta: 0 },
                      { label: "18K White Gold", rateKey: "gold18", delta: 0 },
                    ])
                  }
                >
                  Quick-add 18K yellow / rose / white
                </Button>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label help={value.mode === "rate" ? "Each quality sets the stone value." : "Surcharge (₹) per quality."}>Diamond quality options</Label>
          <div className="space-y-2">
            {value.qualities.map((q, i) => (
              <div key={i} className="flex gap-2">
                <Input value={q.label} placeholder="VS-GH" onChange={(e) => set("qualities", value.qualities.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                {value.mode === "rate" ? (
                  <Input type="number" min={0} value={q.stoneValue} placeholder="Stone ₹" onChange={(e) => set("qualities", value.qualities.map((x, k) => (k === i ? { ...x, stoneValue: Number(e.target.value) } : x)))} className="w-40" />
                ) : (
                  <Input type="number" value={q.delta} placeholder="+₹" onChange={(e) => set("qualities", value.qualities.map((x, k) => (k === i ? { ...x, delta: Number(e.target.value) } : x)))} className="w-40" />
                )}
                <Button type="button" variant="ghost" onClick={() => set("qualities", value.qualities.filter((_, k) => k !== i))}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => set("qualities", [...value.qualities, { label: "", stoneValue: 0, delta: 0 }])}>
                <Plus size={13} /> Add quality
              </Button>
              {value.qualities.length === 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    set("qualities", [
                      { label: "SI-IJ", stoneValue: value.stoneValue || 0, delta: 0 },
                      { label: "VS-GH", stoneValue: Math.round((value.stoneValue || 0) * 1.35), delta: 0 },
                      { label: "VVS-EF", stoneValue: Math.round((value.stoneValue || 0) * 1.8), delta: 0 },
                    ])
                  }
                >
                  Quick-add SI-IJ / VS-GH / VVS-EF
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div>
            <Label>Size label</Label>
            <Input value={value.sizeLabel} onChange={(e) => set("sizeLabel", e.target.value)} placeholder="Ring size" />
          </div>
          <div>
            <Label help="Comma separated. Leave empty if the piece has no sizes.">Sizes</Label>
            <div className="flex gap-2">
              <Input value={value.sizes.join(", ")} onChange={(e) => set("sizes", e.target.value.split(",").map((s) => s.trim()).filter((s, i, a) => s !== "" || i === a.length - 1))} placeholder="8, 10, 12, 14" />
              <Button type="button" variant="secondary" onClick={() => set("sizes", env.ringSizes)}>
                Ring sizes
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-950 p-4 text-sm text-zinc-100">
          <p className="text-xs text-zinc-400">Default variant price (incl. {env.gstPercent}% GST)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{fmt(preview.total)}</p>
          {value.mode === "rate" && (
            <p className="mt-2 text-xs text-zinc-400 tabular-nums">
              Metal {fmt(preview.metal)} + stones {fmt(preview.stone)} + making {fmt(preview.making)} + GST {fmt(preview.gst)}
            </p>
          )}
          {value.mode === "rate" && value.metalWeight === 0 && <p className="mt-2 text-xs text-amber-400">Add a metal weight to enable live-rate pricing.</p>}
        </div>
      </div>
    </Card>
  );
}
