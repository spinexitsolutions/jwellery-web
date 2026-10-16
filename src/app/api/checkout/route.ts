import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPricingContext } from "@/lib/catalog";
import { validateCoupon } from "@/lib/coupons";
import { getCustomerSession } from "@/lib/customer";
import { sendOrderConfirmation } from "@/lib/customer-notify";
import { db } from "@/lib/db";
import { estimateDelivery } from "@/lib/delivery";
import { notifyAll } from "@/lib/notify";
import { nextInvoiceNumber, withTimeline } from "@/lib/orders";
import { computePrice, normalizeSelection, parsePricing, variantLabel } from "@/lib/pricing";
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
  pincode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits"),
  country: z.string().max(80).optional().default("India"),
  notes: z.string().max(1000).optional().default(""),
  paymentMethod: z.enum(["cod", "razorpay"]),
  couponCode: z.string().max(40).optional().default(""),
  giftWrap: z.boolean().optional().default(false),
  giftMessage: z.string().max(300).optional().default(""),
  saveAddress: z.boolean().optional().default(false),
  items: z
    .array(z.object({ id: z.string(), qty: z.number().int().min(1).max(20), selection: z.object({ metal: z.string().optional(), quality: z.string().optional(), size: z.string().optional() }).optional() }))
    .min(1)
    .max(50),
});

function orderNumber() {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `KY${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message === "Required" ? "Please complete all required fields." : parsed.error.issues[0]?.message }, { status: 400 });
  const input = parsed.data;
  const [site, integrations, commerce, ctx, session] = await Promise.all([getSetting("site"), getSetting("integrations"), getSetting("commerce"), getPricingContext(), getCustomerSession()]);

  const razorpayReady = integrations.razorpayEnabled && integrations.razorpayKeyId && integrations.razorpayKeySecret;
  if (input.paymentMethod === "razorpay" && !razorpayReady) return NextResponse.json({ error: "Online payment is not available." }, { status: 400 });

  // Recompute every price on the server from the catalogue and live metal rates.
  const products = await db.product.findMany({ where: { id: { in: input.items.map((i) => i.id) }, published: true } });
  const lines = [];
  for (const item of input.items) {
    const p = products.find((x) => x.id === item.id);
    if (!p) continue;
    const cfg = parsePricing(p.pricing);
    const sel = normalizeSelection(cfg, item.selection);
    if (cfg.sizes.length && !sel.size) return NextResponse.json({ error: `Please choose a ${cfg.sizeLabel.toLowerCase()} for ${p.name}.` }, { status: 400 });
    const price = computePrice(p.price, cfg, ctx.rates, sel, ctx.gstPercent).total;
    lines.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      hsn: p.hsnCode || commerce.hsnCode,
      huid: p.huid || undefined,
      price,
      qty: item.qty,
      variant: variantLabel(sel, cfg) || undefined,
      selection: sel,
      image: parseJSON<string[]>(p.images, [])[0] ?? "",
    });
  }
  if (lines.length === 0) return NextResponse.json({ error: "Your bag items are no longer available." }, { status: 400 });

  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  let discount = 0;
  let couponCode: string | null = null;
  if (input.couponCode) {
    const c = await validateCoupon(input.couponCode, subtotal);
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 400 });
    discount = c.discount;
    couponCode = c.code;
  }
  const giftWrapFee = input.giftWrap && commerce.giftWrapEnabled ? commerce.giftWrapFee : 0;
  const afterDiscount = subtotal - discount;
  const shipping = site.freeShippingAbove > 0 && afterDiscount >= site.freeShippingAbove ? 0 : site.shippingFlat;
  const total = Math.max(0, afterDiscount + giftWrapFee + shipping);

  const delivery = await estimateDelivery(input.pincode, total);
  if (!delivery.serviceable) return NextResponse.json({ error: delivery.message }, { status: 400 });
  // COD limits only apply when an online alternative exists.
  if (input.paymentMethod === "cod" && !delivery.cod && razorpayReady) return NextResponse.json({ error: "Pay on delivery isn't available for this order — please pay online." }, { status: 400 });

  // Link to a customer account: the signed-in customer, or one matched/created by email.
  let customerId = session?.sub ?? null;
  if (!customerId) {
    const email = input.email.toLowerCase();
    const existing = await db.customer.findUnique({ where: { email } });
    customerId = existing ? existing.id : (await db.customer.create({ data: { email, name: input.name } })).id;
  }
  if (session && input.saveAddress) {
    const count = await db.address.count({ where: { customerId: session.sub } });
    await db.address.create({
      data: { customerId: session.sub, name: input.name, phone: input.phone, line1: input.line1, line2: input.line2, city: input.city, state: input.state, pincode: input.pincode, country: input.country, isDefault: count === 0 },
    });
  }

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

  const taxAmount = Math.round((total - total / (1 + commerce.gstPercent / 100)) * 100) / 100;
  let order = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await db.order.create({
        data: {
          number,
          accessKey: randomBytes(12).toString("base64url"),
          invoiceNumber: await nextInvoiceNumber(),
          customerId,
          customerName: input.name,
          email: input.email.toLowerCase(),
          phone: input.phone,
          address: JSON.stringify({ line1: input.line1, line2: input.line2, city: input.city, state: input.state, pincode: input.pincode, country: input.country }),
          items: JSON.stringify(lines),
          subtotal,
          discount,
          couponCode,
          giftWrap: giftWrapFee > 0,
          giftWrapFee,
          giftMessage: input.giftWrap ? input.giftMessage : null,
          shipping,
          total,
          taxRate: commerce.gstPercent,
          taxAmount,
          paymentMethod: input.paymentMethod,
          razorpayOrderId,
          notes: input.notes,
          timeline: withTimeline({ timeline: "[]" }, "placed", delivery.date ? `Estimated delivery ${new Date(delivery.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : undefined),
        },
      });
    } catch (e) {
      if (!String(e).includes("Unique constraint") || attempt === 2) throw e;
    }
  }
  if (!order) return NextResponse.json({ error: "Could not place the order." }, { status: 500 });

  if (couponCode) await db.coupon.update({ where: { code: couponCode }, data: { usedCount: { increment: 1 } } }).catch(() => null);
  await Promise.all(lines.map((l) => db.product.update({ where: { id: l.id }, data: { stock: { decrement: l.qty } } }).catch(() => null)));
  await notifyAll("order.created", `New order ${number}`, { number, customer: input.name, email: input.email, phone: input.phone, total, paymentMethod: input.paymentMethod });
  if (input.paymentMethod === "cod") await sendOrderConfirmation(order);

  return NextResponse.json({
    number: order.number,
    key: order.accessKey,
    razorpay: razorpayOrderId ? { orderId: razorpayOrderId, keyId: integrations.razorpayKeyId, amount: Math.round(total * 100), currency: site.currency || "INR" } : null,
  });
}
