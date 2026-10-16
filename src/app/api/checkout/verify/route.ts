import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/customer-notify";
import { fireWebhooks } from "@/lib/notify";
import { withTimeline } from "@/lib/orders";
import { getSetting } from "@/lib/settings";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, number } = body as Record<string, string>;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !number) return NextResponse.json({ ok: false }, { status: 400 });
  const order = await db.order.findUnique({ where: { number } });
  if (!order || order.razorpayOrderId !== razorpay_order_id) return NextResponse.json({ ok: false }, { status: 400 });
  const { razorpayKeySecret } = await getSetting("integrations");
  const expected = createHmac("sha256", razorpayKeySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  const valid = expected.length === razorpay_signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  const updated = await db.order.update({
    where: { id: order.id },
    data: valid ? { paymentStatus: "paid", status: "confirmed", paymentId: razorpay_payment_id, timeline: withTimeline(order, "confirmed", "Payment received") } : { paymentStatus: "failed" },
  });
  if (valid) {
    await fireWebhooks("order.paid", { number, paymentId: razorpay_payment_id, total: order.total });
    await sendOrderConfirmation(updated);
  }
  return NextResponse.json({ ok: valid }, { status: valid ? 200 : 400 });
}
