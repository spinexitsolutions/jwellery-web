import { NextResponse } from "next/server";
import { viewProducts } from "@/lib/catalog";
import { db } from "@/lib/db";

/** Public product cards by id (used by the guest wishlist). */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, 60);
  if (!ids.length) return NextResponse.json({ data: [] });
  const rows = await db.product.findMany({ where: { id: { in: ids }, published: true }, include: { collection: true } });
  return NextResponse.json({ data: await viewProducts(rows) });
}
