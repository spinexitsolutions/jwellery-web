import { notFound } from "next/navigation";
import { Fulfilment } from "@/components/admin/Fulfilment";
import { Card, PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { formatPrice, parseJSON } from "@/lib/utils";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [o, site, integrations] = await Promise.all([db.order.findUnique({ where: { id }, include: { returns: true } }), getSetting("site"), getSetting("integrations")]);
  if (!o) notFound();
  const items = parseJSON<{ name: string; qty: number; price: number; slug?: string; image?: string; sku?: string; variant?: string; huid?: string }[]>(o.items, []);
  const timeline = parseJSON<{ status: string; note?: string; at: string }[]>(o.timeline, []);
  const a = parseJSON<Record<string, string>>(o.address, {});
  const fmt = (n: number) => formatPrice(n, site.currency);
  return (
    <>
      <PageTitle
        title={`Order ${o.number}`}
        description={`${new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}${o.invoiceNumber ? ` · Invoice ${o.invoiceNumber}` : ""}`}
        back={{ href: "/admin/orders", label: "Orders" }}
        actions={
          <a href={`/api/orders/${o.number}/invoice`} target="_blank" className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm hover:bg-zinc-50">
            GST invoice (PDF)
          </a>
        }
      />
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
                      {[i.variant, i.sku, `${fmt(i.price)} × ${i.qty}`, i.huid && `HUID ${i.huid}`].filter(Boolean).join(" · ")}
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
              {o.discount > 0 && (
                <div className="flex justify-between text-zinc-500">
                  <span>Discount {o.couponCode && `(${o.couponCode})`}</span>
                  <span className="tabular-nums">−{fmt(o.discount)}</span>
                </div>
              )}
              {o.giftWrapFee > 0 && (
                <div className="flex justify-between text-zinc-500">
                  <span>Gift wrap</span>
                  <span className="tabular-nums">{fmt(o.giftWrapFee)}</span>
                </div>
              )}
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
          {(o.notes || o.giftMessage) && (
            <Card title="Notes">
              {o.giftMessage && <p className="mb-2 text-sm">🎁 Gift message: “{o.giftMessage}”</p>}
              {o.notes && <p className="whitespace-pre-wrap text-sm text-zinc-700">{o.notes}</p>}
            </Card>
          )}
          <Card title="Timeline">
            <ol className="space-y-3 text-sm">
              {[...timeline].reverse().map((t, k) => (
                <li key={k} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <div>
                    <p className="font-medium capitalize">{t.status.replace(/_/g, " ")}</p>
                    {t.note && <p className="text-zinc-500">{t.note}</p>}
                    <p className="text-xs text-zinc-400">{new Date(t.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                </li>
              ))}
              {timeline.length === 0 && <li className="text-zinc-500">No events yet.</li>}
            </ol>
          </Card>
          {o.returns.length > 0 && (
            <Card title="Return requests">
              {o.returns.map((r) => (
                <a key={r.id} href="/admin/returns" className="block text-sm hover:underline">
                  {r.type} · {r.status} · {r.reason}
                </a>
              ))}
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Fulfilment
            id={o.id}
            status={o.status === "pending" ? "placed" : o.status}
            paymentStatus={o.paymentStatus}
            courier={o.courier ?? ""}
            awb={o.awb ?? ""}
            trackingUrl={o.trackingUrl ?? ""}
            shipmentId={o.shipmentId}
            shiprocket={integrations.shiprocketEnabled}
            items={items.map((i) => ({ name: i.name, huid: i.huid ?? "" }))}
          />
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
