import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const s = await getCustomerSession();
  if (!s) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { productId } = (await req.json().catch(() => ({}))) as { productId?: string };
  if (!productId || !(await db.product.findUnique({ where: { id: productId }, select: { id: true } }))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const key = { customerId_productId: { customerId: s.sub, productId } };
  const existing = await db.wishlistItem.findUnique({ where: key });
  if (existing) await db.wishlistItem.delete({ where: key });
  else await db.wishlistItem.create({ data: { customerId: s.sub, productId } });
  return NextResponse.json({ ok: true, saved: !existing });
}
