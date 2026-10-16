import { Badge, EmptyState, PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [customers, site] = await Promise.all([
    db.customer.findMany({
      where: q ? { OR: [{ email: { contains: q } }, { phone: { contains: q } }, { name: { contains: q } }] } : {},
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { orders: { select: { total: true, status: true, createdAt: true } }, _count: { select: { wishlist: true } } },
    }),
    getSetting("site"),
  ]);
  return (
    <>
      <PageTitle title="Customers" description="Everyone who has signed in or placed an order." />
      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search name, email or phone" className="h-10 w-full max-w-sm rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400" />
      </form>
      {customers.length === 0 ? (
        <EmptyState title="No customers yet" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">Spent</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Wishlist</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {customers.map((c) => {
                const valid = c.orders.filter((o) => o.status !== "cancelled");
                const spent = valid.reduce((a, o) => a + o.total, 0);
                return (
                  <tr key={c.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{c.name || "—"}</p>
                      <p className="text-xs text-zinc-500">{[c.email, c.phone && `+${c.phone}`].filter(Boolean).join(" · ")}</p>
                    </td>
                    <td className="px-5 py-3">
                      <a href={`/admin/orders?q=${encodeURIComponent(c.email ?? "")}`} className="hover:underline">
                        {valid.length}
                      </a>
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {formatPrice(spent, site.currency)} {spent > 300000 && <Badge tone="violet">VIP</Badge>}
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">{c._count.wishlist}</td>
                    <td className="hidden px-5 py-3 text-zinc-500 md:table-cell">{formatDate(c.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
