import Link from "next/link";
import { Badge, EmptyState, PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { formatDate, formatPrice } from "@/lib/utils";

const STATUSES = ["all", "pending", "placed", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"];
const tone = (s: string) => (s === "delivered" || s === "paid" ? "green" : s === "cancelled" || s === "failed" ? "red" : s === "pending" || s === "unpaid" ? "amber" : "blue") as "green" | "red" | "amber" | "blue";

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "all", q } = await searchParams;
  const where = {
    ...(status !== "all" ? { status } : {}),
    ...(q ? { OR: [{ number: { contains: q.toUpperCase() } }, { email: { contains: q.toLowerCase() } }, { customerName: { contains: q } }, { phone: { contains: q } }] } : {}),
  };
  const [orders, site] = await Promise.all([db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }), getSetting("site")]);
  return (
    <>
      <PageTitle title="Orders" description="Every order placed through checkout." />
      <form className="mb-3">
        <input name="q" defaultValue={q} placeholder="Search order number, name, email or phone" className="h-10 w-full max-w-sm rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400" />
      </form>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders${s === "all" ? "" : `?status=${s}`}`} className={`rounded-full px-3 py-1.5 text-xs capitalize ${status === s ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white hover:bg-zinc-50"}`}>
            {s}
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <EmptyState title="No orders here" description="When customers check out, their orders will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Date</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50/60">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-medium hover:underline">
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{o.customerName}</p>
                    <p className="text-xs text-zinc-500">{o.phone}</p>
                  </td>
                  <td className="hidden px-5 py-3 text-zinc-500 md:table-cell">{formatDate(o.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={tone(o.paymentStatus)}>{o.paymentMethod === "cod" ? "COD" : "Online"} · {o.paymentStatus}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={tone(o.status)}>{o.status.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatPrice(o.total, site.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
