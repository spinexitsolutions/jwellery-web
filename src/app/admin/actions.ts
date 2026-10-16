"use server";

import bcrypt from "bcryptjs";
import { unlink } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateKey } from "@/lib/apikey";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SECTION_MAP, type Section } from "@/lib/sections";
import { saveSetting, getSetting } from "@/lib/settings";
import { SECRET_INTEGRATION_KEYS, type Integrations, type Navigation, type SiteSettings, type ThemeSettings } from "@/lib/settings-types";
import { slugify } from "@/lib/utils";

type Result<T = unknown> = { ok: true; data?: T } | { ok?: false; error: string };

function refresh() {
  revalidatePath("/", "layout");
}

function fail(e: unknown): { error: string } {
  if (e instanceof z.ZodError) return { error: e.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join(", ") };
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("Unique constraint")) return { error: "That slug / value is already in use — please choose another." };
  return { error: msg };
}

/* ---------------- Media ---------------- */
export async function listMedia() {
  await requireAdmin();
  return db.media.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
}

export async function updateMediaAlt(id: string, alt: string): Promise<Result> {
  await requireAdmin();
  await db.media.update({ where: { id }, data: { alt } });
  return { ok: true };
}

export async function deleteMedia(id: string): Promise<Result> {
  await requireAdmin();
  const m = await db.media.delete({ where: { id } });
  if (m.url.startsWith("/uploads/")) {
    const root = path.resolve(process.env.UPLOAD_DIR || "./uploads");
    const file = path.resolve(root, m.url.replace("/uploads/", ""));
    if (file.startsWith(root + path.sep)) await unlink(file).catch(() => {});
  }
  return { ok: true };
}

/* ---------------- Pages ---------------- */
const pageMeta = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  published: z.boolean(),
  showInNav: z.boolean(),
});

const RESERVED = ["shop", "collections", "journal", "checkout", "order", "admin", "api", "uploads", "cart"];

export async function createPage(title: string, template: "blank" | "content" = "content"): Promise<Result<{ id: string }>> {
  await requireAdmin();
  try {
    let slug = slugify(title) || "page";
    if (RESERVED.includes(slug)) slug = `${slug}-page`;
    while (await db.page.findUnique({ where: { slug } })) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
    const sections: Section[] =
      template === "blank"
        ? []
        : [
            { id: Math.random().toString(36).slice(2, 10), type: "pageHeader", data: { ...SECTION_MAP.pageHeader.defaults, title } },
            { id: Math.random().toString(36).slice(2, 10), type: "richText", data: { ...SECTION_MAP.richText.defaults } },
          ];
    const page = await db.page.create({ data: { title, slug, sections: JSON.stringify(sections), published: false } });
    refresh();
    return { ok: true, data: { id: page.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function savePage(id: string, meta: z.infer<typeof pageMeta>, sections: Section[]): Promise<Result> {
  await requireAdmin();
  try {
    const m = pageMeta.parse(meta);
    const existing = await db.page.findUnique({ where: { id } });
    const slug = existing?.slug === "home" ? "home" : slugify(m.slug);
    if (RESERVED.includes(slug)) return { error: `"${slug}" is reserved by the site — choose another slug.` };
    const clean = sections.filter((s) => SECTION_MAP[s.type]).map((s) => ({ id: s.id, type: s.type, hidden: !!s.hidden, data: s.data }));
    await db.page.update({ where: { id }, data: { ...m, slug, sections: JSON.stringify(clean) } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function duplicatePage(id: string): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const p = await db.page.findUniqueOrThrow({ where: { id } });
  const copy = await db.page.create({
    data: { title: `${p.title} (copy)`, slug: `${p.slug}-copy-${Math.random().toString(36).slice(2, 5)}`, sections: p.sections, published: false, seoTitle: p.seoTitle, seoDescription: p.seoDescription },
  });
  refresh();
  return { ok: true, data: { id: copy.id } };
}

export async function deletePage(id: string): Promise<Result> {
  await requireAdmin();
  const p = await db.page.findUnique({ where: { id } });
  if (p?.slug === "home") return { error: "The home page can't be deleted." };
  await db.page.delete({ where: { id } });
  refresh();
  return { ok: true };
}

/* ---------------- Collections ---------------- */
const collectionInput = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  featured: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

export async function saveCollection(id: string | null, input: z.infer<typeof collectionInput>): Promise<Result<{ id: string }>> {
  await requireAdmin();
  try {
    const d = collectionInput.parse(input);
    const data = { ...d, slug: slugify(d.slug || d.name) };
    const row = id ? await db.collection.update({ where: { id }, data }) : await db.collection.create({ data });
    refresh();
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCollection(id: string): Promise<Result> {
  await requireAdmin();
  await db.collection.delete({ where: { id } });
  refresh();
  return { ok: true };
}

/* ---------------- Products ---------------- */
const productInput = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  sku: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  compareAtPrice: z.coerce.number().nonnegative().nullable().optional(),
  images: z.array(z.string()),
  metal: z.string().optional().nullable(),
  purity: z.string().optional().nullable(),
  gemstone: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  details: z.array(z.object({ label: z.string(), value: z.string() })),
  tags: z.string().optional().nullable(),
  stock: z.coerce.number().int(),
  featured: z.boolean(),
  published: z.boolean(),
  sortOrder: z.coerce.number().int(),
  collectionId: z.string().optional().nullable(),
  pricing: z.object({
    mode: z.enum(["fixed", "rate"]),
    metalWeight: z.coerce.number().min(0),
    stoneValue: z.coerce.number().min(0),
    makingType: z.enum(["percent", "perGram", "flat"]),
    makingValue: z.coerce.number().min(0),
    metals: z.array(z.object({ label: z.string().min(1), rateKey: z.string(), delta: z.coerce.number() })),
    qualities: z.array(z.object({ label: z.string().min(1), stoneValue: z.coerce.number().min(0), delta: z.coerce.number() })),
    sizes: z.array(z.string()),
    sizeLabel: z.string(),
  }),
  certificateLab: z.string().optional().nullable(),
  certificateNo: z.string().optional().nullable(),
  certificateUrl: z.string().optional().nullable(),
  huid: z.string().optional().nullable(),
  hsnCode: z.string().optional().nullable(),
  tryAtHome: z.boolean(),
});

export type ProductInput = z.infer<typeof productInput>;

export async function saveProduct(id: string | null, input: ProductInput): Promise<Result<{ id: string }>> {
  await requireAdmin();
  try {
    const d = productInput.parse(input);
    const data = {
      ...d,
      slug: slugify(d.slug || d.name),
      compareAtPrice: d.compareAtPrice || null,
      images: JSON.stringify(d.images),
      details: JSON.stringify(d.details.filter((x) => x.label || x.value)),
      collectionId: d.collectionId || null,
      pricing: JSON.stringify({ ...d.pricing, sizes: d.pricing.sizes.map((s) => s.trim()).filter(Boolean) }),
      huid: d.huid ? d.huid.trim().toUpperCase() : null,
    };
    const row = id ? await db.product.update({ where: { id }, data }) : await db.product.create({ data });
    refresh();
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkProducts(ids: string[], action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"): Promise<Result> {
  await requireAdmin();
  if (action === "delete") await db.product.deleteMany({ where: { id: { in: ids } } });
  else
    await db.product.updateMany({
      where: { id: { in: ids } },
      data: action === "publish" ? { published: true } : action === "unpublish" ? { published: false } : action === "feature" ? { featured: true } : { featured: false },
    });
  refresh();
  return { ok: true };
}

export async function duplicateProduct(id: string): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const p = await db.product.findUniqueOrThrow({ where: { id } });
  const { id: _omit, createdAt: _c, updatedAt: _u, ...rest } = p; // eslint-disable-line @typescript-eslint/no-unused-vars
  const copy = await db.product.create({ data: { ...rest, name: `${p.name} (copy)`, slug: `${p.slug}-copy-${Math.random().toString(36).slice(2, 5)}`, published: false } });
  refresh();
  return { ok: true, data: { id: copy.id } };
}

/* ---------------- Posts ---------------- */
const postInput = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  content: z.string(),
  coverImage: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  published: z.boolean(),
  publishedAt: z.string(),
});

export async function savePost(id: string | null, input: z.infer<typeof postInput>): Promise<Result<{ id: string }>> {
  await requireAdmin();
  try {
    const d = postInput.parse(input);
    const data = { ...d, slug: slugify(d.slug || d.title), publishedAt: new Date(d.publishedAt || Date.now()) };
    const row = id ? await db.post.update({ where: { id }, data }) : await db.post.create({ data });
    refresh();
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePost(id: string): Promise<Result> {
  await requireAdmin();
  await db.post.delete({ where: { id } });
  refresh();
  return { ok: true };
}

/* ---------------- Orders / inquiries / subscribers ---------------- */
export async function updateOrder(id: string, data: { status?: string; paymentStatus?: string; notes?: string }): Promise<Result> {
  await requireAdmin();
  await db.order.update({ where: { id }, data });
  return { ok: true };
}

export async function deleteOrder(id: string): Promise<Result> {
  await requireAdmin({ role: "admin" });
  await db.order.delete({ where: { id } });
  return { ok: true };
}

export async function updateInquiry(id: string, status: string): Promise<Result> {
  await requireAdmin();
  await db.inquiry.update({ where: { id }, data: { status } });
  return { ok: true };
}

export async function deleteInquiry(id: string): Promise<Result> {
  await requireAdmin();
  await db.inquiry.delete({ where: { id } });
  return { ok: true };
}

export async function deleteSubscriber(id: string): Promise<Result> {
  await requireAdmin();
  await db.subscriber.delete({ where: { id } });
  return { ok: true };
}

/* ---------------- Settings ---------------- */
export async function saveSiteSettings(value: SiteSettings): Promise<Result> {
  await requireAdmin();
  await saveSetting("site", value);
  refresh();
  return { ok: true };
}

export async function saveTheme(value: ThemeSettings): Promise<Result> {
  await requireAdmin();
  await saveSetting("theme", value);
  refresh();
  return { ok: true };
}

export async function saveNavigation(value: Navigation): Promise<Result> {
  await requireAdmin();
  await saveSetting("navigation", value);
  refresh();
  return { ok: true };
}

const MASK = "••••••••";

/** Secrets are sent to the browser masked; an unchanged mask keeps the stored value. */
export async function getIntegrationsForAdmin(): Promise<Integrations> {
  await requireAdmin({ role: "admin" });
  const i = await getSetting("integrations");
  const out = { ...i } as Record<string, unknown>;
  for (const k of SECRET_INTEGRATION_KEYS) if (out[k]) out[k] = MASK;
  return out as Integrations;
}

export async function saveIntegrations(value: Integrations): Promise<Result> {
  await requireAdmin({ role: "admin" });
  const current = await getSetting("integrations");
  const next = { ...value } as Record<string, unknown>;
  for (const k of SECRET_INTEGRATION_KEYS) if (next[k] === MASK) next[k] = current[k];
  await saveSetting("integrations", next as Integrations);
  refresh();
  return { ok: true };
}

export async function testWebhook(url: string): Promise<Result> {
  await requireAdmin({ role: "admin" });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kaaya-Event": "test" },
      body: JSON.stringify({ event: "test", data: { message: "Hello from your jewellery store" }, sentAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(6000),
    });
    return res.ok ? { ok: true } : { error: `Endpoint responded with ${res.status}` };
  } catch (e) {
    return fail(e);
  }
}

export async function testRatesApi(): Promise<Result<unknown>> {
  await requireAdmin({ role: "admin" });
  const i = await getSetting("integrations");
  if (!i.ratesApiUrl) return { error: "Add an API URL and save first." };
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (i.ratesApiHeaderName) headers[i.ratesApiHeaderName] = i.ratesApiHeaderValue;
    const res = await fetch(i.ratesApiUrl, { headers, signal: AbortSignal.timeout(6000), cache: "no-store" });
    const text = await res.text();
    return { ok: true, data: text.slice(0, 2000) };
  } catch (e) {
    return fail(e);
  }
}

/* ---------------- API keys ---------------- */
export async function createApiKey(name: string, scopes: string[]): Promise<Result<{ key: string }>> {
  await requireAdmin({ role: "admin" });
  if (!name.trim()) return { error: "Give the key a name." };
  const { key, prefix, hash } = generateKey();
  await db.apiKey.create({ data: { name: name.trim(), prefix, hash, scopes: scopes.join(",") || "read" } });
  return { ok: true, data: { key } };
}

export async function deleteApiKey(id: string): Promise<Result> {
  await requireAdmin({ role: "admin" });
  await db.apiKey.delete({ where: { id } });
  return { ok: true };
}

/* ---------------- Users ---------------- */
export async function saveUser(id: string | null, input: { name: string; email: string; role: string; password?: string }): Promise<Result> {
  await requireAdmin({ role: "admin" });
  try {
    const d = z
      .object({ name: z.string().min(1), email: z.string().email(), role: z.enum(["admin", "editor"]), password: z.string().optional() })
      .parse(input);
    if (!id && (!d.password || d.password.length < 8)) return { error: "Password must be at least 8 characters." };
    if (d.password && d.password.length < 8) return { error: "Password must be at least 8 characters." };
    const data = { name: d.name, email: d.email.toLowerCase(), role: d.role, ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 10) } : {}) };
    if (id) await db.user.update({ where: { id }, data });
    else await db.user.create({ data: { ...data, passwordHash: data.passwordHash! } });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteUser(id: string): Promise<Result> {
  const session = await requireAdmin({ role: "admin" });
  if (session.sub === id) return { error: "You can't delete your own account." };
  if ((await db.user.count({ where: { role: "admin" } })) <= 1) {
    const u = await db.user.findUnique({ where: { id } });
    if (u?.role === "admin") return { error: "At least one administrator is required." };
  }
  await db.user.delete({ where: { id } });
  return { ok: true };
}

export async function changeOwnPassword(current: string, next: string): Promise<Result> {
  const session = await requireAdmin();
  const user = await db.user.findUniqueOrThrow({ where: { id: session.sub } });
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Current password is incorrect." };
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: true };
}

/* ---------------- Backup ---------------- */
export async function exportContent() {
  await requireAdmin({ role: "admin" });
  const [settings, pages, collections, products, posts] = await Promise.all([db.setting.findMany(), db.page.findMany(), db.collection.findMany(), db.product.findMany(), db.post.findMany()]);
  const safeSettings = settings.map((s) => {
    if (s.key !== "integrations") return s;
    const v = JSON.parse(s.value);
    for (const k of SECRET_INTEGRATION_KEYS) delete v[k];
    return { ...s, value: JSON.stringify(v) };
  });
  return JSON.stringify({ exportedAt: new Date().toISOString(), settings: safeSettings, pages, collections, products, posts }, null, 2);
}
