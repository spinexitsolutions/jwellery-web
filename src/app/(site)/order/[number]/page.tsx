import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OrderView } from "@/components/site/OrderView";
import { getCustomerSession } from "@/lib/customer";
import { db } from "@/lib/db";
import { canViewOrder, STATUS_LABEL, timelineOf } from "@/lib/orders";
import { getSetting } from "@/lib/settings";
import { parseJSON } from "@/lib/utils";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ payment?: string; k?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params;
  const { payment, k } = await searchParams;
  const order = await db.order.findUnique({ where: { number }, include: { returns: { orderBy: { createdAt: "desc" } } } });
  if (!order) notFound();
  if (!(await canViewOrder(order, k))) {
    return (
      <div className="site-container flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
        <p className="display text-5xl">Sign in to view this order</p>
        <p className="mt-4 max-w-md text-muted">For your privacy, order details are only visible to the account that placed them.</p>
        <div className="mt-8 flex gap-4">
          <Link href={`/account?next=/order/${number}`} className="btn btn-primary">
            Sign in
          </Link>
          <Link href={`/track?order=${number}`} className="btn btn-ghost">
            Track with email
          </Link>
        </div>
      </div>
    );
  }
  const [commerce, session] = await Promise.all([getSetting("commerce"), getCustomerSession()]);
  const isOwner = !!session && session.sub === order.customerId;
  const deliveredAt = [...timelineOf(order)].reverse().find((t) => t.status === "delivered")?.at;
  const returnOpen = !!deliveredAt && Date.now() - new Date(deliveredAt).getTime() <= commerce.returnWindowDays * 864e5;
  return (
    <OrderView
      payment={payment}
      accessKey={order.accessKey ?? ""}
      canRequestReturn={isOwner && order.status === "delivered" && returnOpen && !order.returns.some((r) => !["rejected", "closed", "refunded", "exchanged"].includes(r.status))}
      exchangeEnabled={commerce.exchangeEnabled}
      returnWindowDays={commerce.returnWindowDays}
      order={{
        number: order.number,
        createdAt: order.createdAt.toISOString(),
        status: order.status,
        statusLabel: STATUS_LABEL[order.status] ?? order.status,
        email: order.email,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        discount: order.discount,
        couponCode: order.couponCode,
        giftWrapFee: order.giftWrapFee,
        giftMessage: order.giftMessage,
        shipping: order.shipping,
        total: order.total,
        taxAmount: order.taxAmount,
        courier: order.courier,
        awb: order.awb,
        trackingUrl: order.trackingUrl,
        timeline: timelineOf(order),
        address: parseJSON<Record<string, string>>(order.address, {}),
        items: parseJSON<{ name: string; qty: number; price: number; variant?: string; image?: string; slug?: string; huid?: string }[]>(order.items, []),
        returns: order.returns.map((r) => ({ id: r.id, type: r.type, status: r.status, reason: r.reason, adminNote: r.adminNote, createdAt: r.createdAt.toISOString() })),
      }}
    />
  );
}
