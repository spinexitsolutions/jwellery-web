import { NextResponse } from "next/server";
import { z } from "zod";
import { checkApiKey } from "@/lib/apikey";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { toProductView } from "@/lib/types";
import { parseJSON, slugify } from "@/lib/utils";

type Ctx = { params: Promise<{ path: string[] }> };

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "x-api-key, authorization, content-type", "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS" };
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: cors });
const unauthorized = () => json({ error: "Invalid or missing API key. Send it in the x-api-key header." }, 401);

export function OPTIONS() {
  return new Response(null, { headers: cors });
}

export async function GET(req: Request, { params }: Ctx) {
  if (!(await checkApiKey(req, "read"))) return unauthorized();
  const [resource, id] = (await params).path;
  const url = new URL(req.url);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const offset = Number(url.searchParams.get("offset")) || 0;

  switch (resource) {
    case "products": {
      if (id) {
        const p = await db.product.findFirst({ where: { OR: [{ id }, { slug: id }] }, include: { collection: true } });
        return p ? json({ data: toProductView(p) }) : json({ error: "Not found" }, 404);
      }
      const collection = url.searchParams.get("collection");
      const rows = await db.product.findMany({
        where: { published: true, ...(collection ? { collection: { slug: collection } } : {}) },
        include: { collection: true },
        orderBy: { sortOrder: "asc" },
        take: limit,
        skip: offset,
      });
      return json({ data: rows.map(toProductView), limit, offset });
    }
    case "collections": {
      if (id) {
        const c = await db.collection.findFirst({ where: { OR: [{ id }, { slug: id }] }, include: { products: { where: { published: true } } } });
        return c ? json({ data: { ...c, products: c.products.map(toProductView) } }) : json({ error: "Not found" }, 404);
      }
      return json({ data: await db.collection.findMany({ orderBy: { sortOrder: "asc" } }) });
    }
    case "posts": {
      if (id) {
        const p = await db.post.findFirst({ where: { OR: [{ id }, { slug: id }], published: true } });
        return p ? json({ data: p }) : json({ error: "Not found" }, 404);
      }
      return json({ data: await db.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: limit, skip: offset }) });
    }
    case "pages": {
      if (id) {
        const p = await db.page.findFirst({ where: { OR: [{ id }, { slug: id }], published: true } });
        return p ? json({ data: { ...p, sections: parseJSON(p.sections, []) } }) : json({ error: "Not found" }, 404);
      }
      const rows = await db.page.findMany({ where: { published: true }, select: { id: true, slug: true, title: true, updatedAt: true } });
      return json({ data: rows });
    }
    case "settings": {
      const [site, theme, navigation] = await Promise.all([getSetting("site"), getSetting("theme"), getSetting("navigation")]);
      return json({ data: { site, theme, navigation } });
    }
    case "orders": {
      if (!(await checkApiKey(req, "write"))) return unauthorized();
      if (id) {
        const o = await db.order.findFirst({ where: { OR: [{ id }, { number: id }] } });
        return o ? json({ data: { ...o, items: parseJSON(o.items, []), address: parseJSON(o.address, {}) } }) : json({ error: "Not found" }, 404);
      }
      const rows = await db.order.findMany({ orderBy: { createdAt: "desc" }, take: limit, skip: offset });
      return json({ data: rows.map((o) => ({ ...o, items: parseJSON(o.items, []), address: parseJSON(o.address, {}) })) });
    }
    default:
      return json({ error: `Unknown resource '${resource}'` }, 404);
  }
}

const productInput = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nullable().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  metal: z.string().optional(),
  gemstone: z.string().optional(),
  weight: z.string().optional(),
  stock: z.number().int().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  collection: z.string().optional(),
});

export async function POST(req: Request, { params }: Ctx) {
  if (!(await checkApiKey(req, "write"))) return unauthorized();
  const [resource] = (await params).path;
  const body = await req.json().catch(() => null);
  if (resource === "products") {
    const parsed = productInput.safeParse(body);
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const { collection, images, ...rest } = parsed.data;
    const col = collection ? await db.collection.findFirst({ where: { OR: [{ id: collection }, { slug: collection }] } }) : null;
    const p = await db.product.create({
      data: { ...rest, slug: rest.slug || `${slugify(rest.name)}-${Date.now().toString(36).slice(-4)}`, images: JSON.stringify(images ?? []), collectionId: col?.id },
    });
    return json({ data: toProductView(p) }, 201);
  }
  if (resource === "inquiries") {
    const parsed = z.object({ name: z.string().min(1), email: z.string().email(), phone: z.string().optional(), subject: z.string().optional(), message: z.string().min(1), type: z.string().optional() }).safeParse(body);
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    return json({ data: await db.inquiry.create({ data: parsed.data }) }, 201);
  }
  return json({ error: `POST not supported for '${resource}'` }, 405);
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await checkApiKey(req, "write"))) return unauthorized();
  const [resource, id] = (await params).path;
  const body = await req.json().catch(() => null);
  if (resource === "products" && id) {
    const parsed = productInput.partial().safeParse(body);
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const { collection, images, ...rest } = parsed.data;
    const existing = await db.product.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!existing) return json({ error: "Not found" }, 404);
    const col = collection ? await db.collection.findFirst({ where: { OR: [{ id: collection }, { slug: collection }] } }) : undefined;
    const p = await db.product.update({
      where: { id: existing.id },
      data: { ...rest, ...(images ? { images: JSON.stringify(images) } : {}), ...(col !== undefined ? { collectionId: col?.id ?? null } : {}) },
    });
    return json({ data: toProductView(p) });
  }
  if (resource === "orders" && id) {
    const parsed = z.object({ status: z.string().optional(), paymentStatus: z.string().optional(), notes: z.string().optional() }).safeParse(body);
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const o = await db.order.findFirst({ where: { OR: [{ id }, { number: id }] } });
    if (!o) return json({ error: "Not found" }, 404);
    return json({ data: await db.order.update({ where: { id: o.id }, data: parsed.data }) });
  }
  return json({ error: `PATCH not supported for '${resource}'` }, 405);
}
