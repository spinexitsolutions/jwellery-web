import { StoresManager } from "@/components/admin/StoresManager";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function StoresAdmin() {
  const stores = await db.store.findMany({ orderBy: [{ sortOrder: "asc" }, { city: "asc" }] });
  return (
    <>
      <PageTitle title="Boutiques" description="Store locator entries — shown on /stores and in appointment booking." />
      <StoresManager stores={stores.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))} />
    </>
  );
}
