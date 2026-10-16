import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/customer";
import { db } from "@/lib/db";

export async function GET() {
  const c = await getCustomer();
  if (!c) return NextResponse.json({ customer: null, wishlist: [] });
  const wl = await db.wishlistItem.findMany({ where: { customerId: c.id }, select: { productId: true } });
  return NextResponse.json({ customer: { id: c.id, name: c.name, email: c.email, phone: c.phone }, wishlist: wl.map((w) => w.productId) });
}
