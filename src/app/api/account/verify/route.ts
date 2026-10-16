import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeIdentifier, setCustomerCookie, verifyOtp } from "@/lib/customer";

export async function POST(req: Request) {
  const { identifier, code, wishlist } = (await req.json().catch(() => ({}))) as { identifier?: string; code?: string; wishlist?: string[] };
  const id = normalizeIdentifier(String(identifier ?? ""));
  if (!id || !code) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  if (!(await verifyOtp(id.value, String(code)))) return NextResponse.json({ error: "That code is incorrect or has expired." }, { status: 401 });

  const where = id.kind === "email" ? { email: id.value } : { phone: id.value };
  const customer = (await db.customer.findUnique({ where })) ?? (await db.customer.create({ data: where }));
  // Attach earlier guest orders placed with the same email.
  if (customer.email) await db.order.updateMany({ where: { email: customer.email, customerId: null }, data: { customerId: customer.id } });
  // Merge a guest wishlist kept in the browser.
  if (Array.isArray(wishlist) && wishlist.length) {
    const products = await db.product.findMany({ where: { id: { in: wishlist.slice(0, 100) } }, select: { id: true } });
    for (const p of products) await db.wishlistItem.upsert({ where: { customerId_productId: { customerId: customer.id, productId: p.id } }, update: {}, create: { customerId: customer.id, productId: p.id } });
  }
  await setCustomerCookie(customer);
  return NextResponse.json({ ok: true, needsProfile: !customer.name });
}
