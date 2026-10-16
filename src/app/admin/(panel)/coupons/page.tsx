import { CouponsManager } from "@/components/admin/CouponsManager";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function CouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageTitle title="Coupons" description="Discount codes customers can apply at checkout." />
      <CouponsManager
        coupons={coupons.map((c) => ({
          ...c,
          startsAt: c.startsAt ? c.startsAt.toISOString().slice(0, 10) : "",
          endsAt: c.endsAt ? c.endsAt.toISOString().slice(0, 10) : "",
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
