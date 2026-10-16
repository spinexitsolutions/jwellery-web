import { NextResponse } from "next/server";
import { z } from "zod";
import { getCustomer } from "@/lib/customer";
import { db } from "@/lib/db";
import { notifyAll } from "@/lib/notify";
import { getSetting } from "@/lib/settings";

const schema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().default(""),
  body: z.string().min(10, "Please write at least a sentence.").max(3000),
  name: z.string().min(1).max(80).optional(),
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid review" }, { status: 400 });
  const d = parsed.data;
  const product = await db.product.findUnique({ where: { id: d.productId }, select: { id: true, name: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const customer = await getCustomer();
  const name = d.name || customer?.name;
  const email = (customer?.email || d.email || "").toLowerCase() || null;
  if (!name) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if (!customer && !email) return NextResponse.json({ error: "Please add your email." }, { status: 400 });

  const dupe = await db.review.findFirst({ where: { productId: d.productId, OR: [customer ? { customerId: customer.id } : { id: "-" }, email ? { email } : { id: "-" }] } });
  if (dupe) return NextResponse.json({ error: "You've already reviewed this piece — thank you!" }, { status: 409 });

  // Verified buyer: a non-cancelled order by this customer/email containing the product.
  const orders = await db.order.findMany({
    where: { status: { not: "cancelled" }, OR: [customer ? { customerId: customer.id } : { id: "-" }, email ? { email } : { id: "-" }] },
    select: { items: true },
  });
  const verified = orders.some((o) => o.items.includes(`"id":"${d.productId}"`));
  const { reviewsAutoApprove } = await getSetting("commerce");
  await db.review.create({
    data: { productId: d.productId, customerId: customer?.id, name, email, rating: d.rating, title: d.title || null, body: d.body, verified, status: reviewsAutoApprove ? "approved" : "pending" },
  });
  await notifyAll("review.created", `New ${d.rating}★ review for ${product.name}`, { product: product.name, rating: d.rating, name, verified: verified ? "yes" : "no" });
  return NextResponse.json({ ok: true, published: reviewsAutoApprove });
}
