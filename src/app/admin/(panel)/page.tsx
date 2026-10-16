import Link from "next/link";
import { ArrowUpRight, Boxes, FileText, Gem, Inbox, Mail, Palette, Plus, ShoppingBag } from "lucide-react";
import { Badge, Card, PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function Dashboard() {
  const since = new Date(Date.now() - 13 * 864e5);
  since.setHours(0, 0, 0, 0);
  const [site, products, collections, pages, subscribers, inquiries, orders, recentOrders, recentInquiries, ordersRange] = await Promise.all([
    getSetting("site"),
    db.product.count(),
    db.collection.count(),
    db.page.count(),
    db.subscriber.count(),
    db.inquiry.count({ where: { status: "new" } }),
    db.order.aggregate({ _sum: { total: true }, _count: true, where: { status: { not: "cancelled" } } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.order.findMany({ where: { createdAt: { gte: since }, status: { not: "cancelled" } }, select: { total: true, createdAt: true } }),
  ]);
  const fmt = (n: number) => formatPrice(n, site.currency, site.locale);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since.getTime() + i * 864e5);
    const key = d.toDateString();
    const total = ordersRange.filter((o) => o.createdAt.toDateString() === key).reduce((a, o) => a + o.total, 0);
    return { label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), total };
  });
  const max = Math.max(1, ...days.map((d) => d.total));
  const rangeTotal = days.reduce((a, d) => a + d.total, 0);

  const stats = [
    { label: "Revenue", value: fmt(orders._sum.total ?? 0), icon: ShoppingBag, href: "/admin/orders" },
    { label: "Orders", value: orders._count, icon: ShoppingBag, href: "/admin/orders" },
    { label: "Products", value: products, icon: Gem, href: "/admin/products" },
    { label: "New inquiries", value: inquiries, icon: Inbox, href: "/admin/inquiries" },
    { label: "Subscribers", value: subscribers, icon: Mail, href: "/admin/inquiries?tab=subscribers" },
  ];

  const statusTone = (s: string) => (s === "delivered" ? "green" : s === "cancelled" ? "red" : s === "pending" ? "amber" : "blue") as "green" | "red" | "amber" | "blue";

  return (
    <>
      <PageTitle title="Welcome back" description={`Here's what's happening at ${site.brandName}.`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs">{s.label}</span>
              <s.icon size={15} />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Sales — last 14 days" description={fmt(rangeTotal)} className="lg:col-span-2">
          <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Daily sales for the last 14 days">
            {days.map((d) => (
              <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                  {d.label}: {fmt(d.total)}
                </div>
                <div className="w-full rounded-t-[4px] bg-amber-500/80 transition group-hover:bg-amber-600" style={{ height: `${Math.max(2, (d.total / max) * 100)}%`, opacity: d.total ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
            <span>{days[0].label}</span>
            <span>{days[days.length - 1].label}</span>
          </div>
        </Card>
        <Card title="Quick actions">
          <div className="grid gap-2">
            {[
              { href: "/admin/products/new", label: "Add a product", icon: Plus },
              { href: "/admin/pages", label: "Edit pages & home", icon: FileText },
              { href: "/admin/collections", label: "Manage collections", icon: Boxes },
              { href: "/admin/theme", label: "Customise theme", icon: Palette },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm transition hover:bg-zinc-50">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100">
                  <a.icon size={15} />
                </span>
                <span className="flex-1">{a.label}</span>
                <ArrowUpRight size={14} className="text-zinc-400" />
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            {collections} collections · {pages} pages
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-xs text-zinc-500 hover:text-zinc-900">View all</Link>}>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No orders yet.</p>
          ) : (
            <ul className="-my-2 divide-y divide-zinc-100">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:opacity-80">
                    <span className="font-mono text-xs text-zinc-500">{o.number}</span>
                    <span className="flex-1 truncate">{o.customerName}</span>
                    <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                    <span className="w-24 text-right tabular-nums">{fmt(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Latest inquiries" actions={<Link href="/admin/inquiries" className="text-xs text-zinc-500 hover:text-zinc-900">View all</Link>}>
          {recentInquiries.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No inquiries yet.</p>
          ) : (
            <ul className="-my-2 divide-y divide-zinc-100">
              {recentInquiries.map((q) => (
                <li key={q.id} className="flex items-start gap-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {q.name} <span className="font-normal text-zinc-400">· {formatDate(q.createdAt)}</span>
                    </p>
                    <p className="truncate text-zinc-500">{q.message}</p>
                  </div>
                  <Badge tone={q.status === "new" ? "amber" : "zinc"}>{q.type}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
