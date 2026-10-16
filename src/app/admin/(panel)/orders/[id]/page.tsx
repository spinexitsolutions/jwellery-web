import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin/OrderActions";
import { Card, PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { formatPrice, parseJSON } from "@/lib/utils";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [o, site] = await Promise.all([db.order.findUnique({ where: { id } }), getSetting("site")]);
  if (!o) notFound();
  const items = parseJSON<{ name: string; qty: number; price: number; slug?: string; image?: string; sku?: string }[]>(o.items, []);
  const a = parseJSON<Record<string, string>>(o.address, {});
  const fmt = (n: number) => formatPrice(n, site.currency);
  return (
    <>
      <PageTitle title={`Order ${o.number}`} description={new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })} back={{ href: "/admin/orders", label: "Orders" }} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Items">
            <ul className="divide-y divide-zinc-100">
              {items.map((i, k) => (
                <li key={k} className="flex items-center gap-4 py-3">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{i.name}</p>
                    <p className="text-xs text-zinc-500">
                      {i.sku} · {fmt(i.price)} × {i.qty}
                    </p>
                  </div>
                  <p className="tabular-nums">{fmt(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-zinc-100 pt-4 text-sm">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmt(o.subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Shipping</span>
                <span className="tabular-nums">{fmt(o.shipping)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{fmt(o.total)}</span>
              </div>
            </div>
          </Card>
          {o.notes && (
            <Card title="Customer note">
              <p className="whitespace-pre-wrap text-sm text-zinc-700">{o.notes}</p>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <OrderActions id={o.id} status={o.status} paymentStatus={o.paymentStatus} />
          <Card title="Customer">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{o.customerName}</p>
              <a href={`mailto:${o.email}`} className="block text-zinc-600 hover:underline">
                {o.email}
              </a>
              <a href={`tel:${o.phone}`} className="block text-zinc-600 hover:underline">
                {o.phone}
              </a>
            </div>
            <div className="mt-4 border-t border-zinc-100 pt-4 text-sm text-zinc-600">
              <p>{a.line1}</p>
              {a.line2 && <p>{a.line2}</p>}
              <p>
                {a.city}, {a.state} {a.pincode}
              </p>
              <p>{a.country}</p>
            </div>
          </Card>
          <Card title="Payment">
            <div className="space-y-1 text-sm text-zinc-600">
              <p>Method: {o.paymentMethod === "cod" ? "Pay on delivery" : "Razorpay"}</p>
              {o.razorpayOrderId && <p className="font-mono text-xs">RZP order: {o.razorpayOrderId}</p>}
              {o.paymentId && <p className="font-mono text-xs">Payment: {o.paymentId}</p>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
