import { ReturnsManager } from "@/components/admin/ReturnsManager";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { parseJSON } from "@/lib/utils";

export default async function ReturnsPage() {
  const rows = await db.returnRequest.findMany({ orderBy: { createdAt: "desc" }, include: { order: true } });
  return (
    <>
      <PageTitle title="Returns & exchanges" description="Requests customers submit from their order page." />
      <ReturnsManager
        rows={rows.map((r) => ({
          id: r.id,
          type: r.type,
          status: r.status,
          reason: r.reason,
          details: r.details,
          adminNote: r.adminNote ?? "",
          items: parseJSON<string[]>(r.items, []),
          createdAt: r.createdAt.toISOString(),
          order: { id: r.order.id, number: r.order.number, customerName: r.order.customerName, email: r.order.email, phone: r.order.phone, total: r.order.total, paymentMethod: r.order.paymentMethod },
        }))}
      />
    </>
  );
}
