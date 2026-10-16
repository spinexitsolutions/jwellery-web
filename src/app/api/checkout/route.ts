import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyAll } from "@/lib/notify";
import { getSetting } from "@/lib/settings";
import { parseJSON } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  line1: z.string().min(2).max(300),
  line2: z.string().max(300).optional().default(""),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(3).max(15),
  country: z.string().max(80).optional().default("India"),
  notes: z.string().max(1000).optional().default(""),
  paymentMethod: z.enum(["cod", "razorpay"]),
  items: z.array(z.object({ id: z.string(), qty: z.number().int().min(1).max(20) })).min(1).max(50),
});

function orderNumber() {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `KY${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  const input = parsed.data;
  const [site, integrations] = await Promise.all([getSetting("site"), getSetting("integrations")]);

  const razorpayReady = integrations.razorpayEnabled && integrations.razorpayKeyId && integrations.razorpayKeySecret;
  if (input.paymentMethod === "razorpay" && !razorpayReady) return NextResponse.json({ error: "Online payment is not available." }, { status: 400 });
  if (input.paymentMethod === "cod" && !site.codEnabled && razorpayReady) return NextResponse.json({ error: "Pay on delivery is not available." }, { status: 400 });

  // Recompute prices from the database — never trust client totals.
  const products = await db.product.findMany({ where: { id: { in: input.items.map((i) => i.id) }, published: true } });
  const lines = input.items
    .map((i) => {
      const p = products.find((x) => x.id === i.id);
      return p ? { id: p.id, name: p.name, slug: p.slug, sku: p.sku, price: p.price, qty: i.qty, image: parseJSON<string[]>(p.images, [])[0] ?? "" } : null;
    })
    .filter(Boolean) as { id: string; name: string; price: number; qty: number }[];
  if (lines.length === 0) return NextResponse.json({ error: "Your bag items are no longer available." }, { status: 400 });

  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const shipping = site.freeShippingAbove > 0 && subtotal >= site.freeShippingAbove ? 0 : site.shippingFlat;
  const total = subtotal + shipping;
  const number = orderNumber();

  let razorpayOrderId: string | undefined;
  if (input.paymentMethod === "razorpay") {
    const auth = Buffer.from(`${integrations.razorpayKeyId}:${integrations.razorpayKeySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(total * 100), currency: site.currency || "INR", receipt: number }),
    }).catch(() => null);
    if (!res || !res.ok) return NextResponse.json({ error: "Payment gateway error. Please try again or choose pay on delivery." }, { status: 502 });
    razorpayOrderId = (await res.json()).id;
  }

  const order = await db.order.create({
    data: {
      number,
      customerName: input.name,
      email: input.email,
      phone: input.phone,
      address: JSON.stringify({ line1: input.line1, line2: input.line2, city: input.city, state: input.state, pincode: input.pincode, country: input.country }),
      items: JSON.stringify(lines),
      subtotal,
      shipping,
      total,
      paymentMethod: input.paymentMethod,
      razorpayOrderId,
      notes: input.notes,
    },
  });

  await Promise.all(lines.map((l) => db.product.update({ where: { id: l.id }, data: { stock: { decrement: l.qty } } }).catch(() => null)));
  await notifyAll("order.created", `New order ${number}`, { number, customer: input.name, email: input.email, phone: input.phone, total, paymentMethod: input.paymentMethod });

  return NextResponse.json({
    number: order.number,
    razorpay: razorpayOrderId ? { orderId: razorpayOrderId, keyId: integrations.razorpayKeyId, amount: Math.round(total * 100), currency: site.currency || "INR" } : null,
  });
}
