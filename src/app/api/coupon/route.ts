import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";

export async function POST(req: Request) {
  const { code, subtotal } = (await req.json().catch(() => ({}))) as { code?: string; subtotal?: number };
  const r = await validateCoupon(String(code ?? ""), Number(subtotal) || 0);
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
