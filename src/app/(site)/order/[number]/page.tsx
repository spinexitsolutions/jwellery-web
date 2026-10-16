import Link from "next/link";
import { notFound } from "next/navigation";
import { SplitText } from "@/components/site/motion";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { formatPrice, parseJSON } from "@/lib/utils";

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ payment?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params;
  const { payment } = await searchParams;
  const order = await db.order.findUnique({ where: { number } });
  if (!order) notFound();
  const site = await getSetting("site");
  const items = parseJSON<{ name: string; qty: number; price: number }[]>(order.items, []);
  const fmt = (n: number) => formatPrice(n, site.currency, site.locale);
  return (
    <div className="site-container max-w-3xl pb-28 pt-36 text-center md:pt-48">
      <p className="eyebrow">Order {order.number}</p>
      <SplitText as="h1" immediate text={payment === "failed" ? "Payment *pending*" : "Thank *you*"} className="display mt-6 block text-[clamp(3.6rem,10vw,9rem)] leading-[0.9]" />
      <p className="mx-auto mt-8 max-w-md text-muted">
        {payment === "failed"
          ? "We couldn't confirm your payment. Your order is saved — our concierge will contact you to complete it."
          : `A confirmation has been sent to ${order.email}. Our concierge will call you shortly to arrange insured delivery.`}
      </p>
      <div className="mt-14 rounded-[var(--radius)] bg-surface p-8 text-left">
        {items.map((i, k) => (
          <div key={k} className="flex justify-between border-b border-line py-3 text-sm">
            <span>
              {i.name} × {i.qty}
            </span>
            <span className="tabular-nums">{fmt(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-4 text-lg">
          <span>Total</span>
          <span className="tabular-nums">{fmt(order.total)}</span>
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">
          {order.paymentMethod === "cod" ? "Pay on delivery" : "Paid online"} · {order.paymentStatus}
        </p>
      </div>
      <Link href="/shop" className="btn btn-primary mt-12">
        Continue browsing
      </Link>
    </div>
  );
}
