import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shiprocketFetch } from "@/lib/delivery";
import { STATUS_LABEL, timelineOf } from "@/lib/orders";
import { getSetting } from "@/lib/settings";
import { parseJSON } from "@/lib/utils";

export async function POST(req: Request) {
  const { number, contact } = (await req.json().catch(() => ({}))) as { number?: string; contact?: string };
  const n = String(number ?? "").trim().toUpperCase();
  const c = String(contact ?? "").trim().toLowerCase();
  if (!n || !c) return NextResponse.json({ error: "Enter your order number and the email or phone used to order." }, { status: 400 });
  const order = await db.order.findUnique({ where: { number: n } });
  const digits = (s: string) => s.replace(/[^0-9]/g, "").slice(-10);
  const match = order && (order.email.toLowerCase() === c || (digits(c).length === 10 && digits(order.phone) === digits(c)));
  if (!order || !match) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "We couldn't find an order with those details." }, { status: 404 });
  }

  let courierEvents: { date: string; activity: string; location: string }[] = [];
  const i = await getSetting("integrations");
  if (order.awb && i.shiprocketEnabled) {
    try {
      const json = await shiprocketFetch(`/courier/track/awb/${encodeURIComponent(order.awb)}`);
      courierEvents = (json?.tracking_data?.shipment_track_activities ?? []).slice(0, 15).map((a: Record<string, string>) => ({ date: a.date, activity: a.activity, location: a.location }));
    } catch {}
  }

  return NextResponse.json({
    number: order.number,
    key: order.accessKey,
    status: order.status,
    statusLabel: STATUS_LABEL[order.status] ?? order.status,
    placedAt: order.createdAt,
    total: order.total,
    items: parseJSON<{ name: string; qty: number; variant?: string; image?: string }[]>(order.items, []).map((x) => ({ name: x.name, qty: x.qty, variant: x.variant, image: x.image })),
    timeline: timelineOf(order),
    courier: order.courier,
    awb: order.awb,
    trackingUrl: order.trackingUrl,
    courierEvents,
  });
}
