import { NextResponse } from "next/server";
import { z } from "zod";
import { getCustomerSession } from "@/lib/customer";
import { db } from "@/lib/db";
import { notifyAll } from "@/lib/notify";
import { timelineOf } from "@/lib/orders";
import { getSetting } from "@/lib/settings";

const schema = z.object({
  number: z.string(),
  type: z.enum(["return", "exchange"]),
  reason: z.string().min(2).max(120),
  details: z.string().max(2000).optional().default(""),
  items: z.array(z.string()).min(1, "Choose at least one item."),
});

export async function POST(req: Request) {
  const s = await getCustomerSession();
  if (!s) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  const d = parsed.data;
  const order = await db.order.findUnique({ where: { number: d.number }, include: { returns: true } });
  if (!order || order.customerId !== s.sub) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const c = await getSetting("commerce");
  if (d.type === "exchange" && !c.exchangeEnabled) return NextResponse.json({ error: "Exchanges aren't available." }, { status: 400 });
  if (order.status !== "delivered") return NextResponse.json({ error: "Returns can be requested once the order is delivered." }, { status: 400 });
  const deliveredAt = [...timelineOf(order)].reverse().find((t) => t.status === "delivered")?.at ?? order.updatedAt.toISOString();
  if (Date.now() - new Date(deliveredAt).getTime() > c.returnWindowDays * 864e5) return NextResponse.json({ error: `The ${c.returnWindowDays}-day return window for this order has closed.` }, { status: 400 });
  if (order.returns.some((r) => !["rejected", "closed", "refunded", "exchanged"].includes(r.status))) return NextResponse.json({ error: "There's already an open request for this order." }, { status: 409 });

  const r = await db.returnRequest.create({ data: { orderId: order.id, type: d.type, reason: d.reason, details: d.details, items: JSON.stringify(d.items) } });
  await notifyAll("return.created", `${d.type === "return" ? "Return" : "Exchange"} requested for ${order.number}`, { order: order.number, type: d.type, reason: d.reason, id: r.id });
  return NextResponse.json({ ok: true });
}
