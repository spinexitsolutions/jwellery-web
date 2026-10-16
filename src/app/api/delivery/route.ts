import { NextResponse } from "next/server";
import { estimateDelivery } from "@/lib/delivery";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const r = await estimateDelivery(String(url.searchParams.get("pincode") ?? "").trim(), Number(url.searchParams.get("amount")) || 0);
  return NextResponse.json(r);
}
