import { AppointmentsManager } from "@/components/admin/AppointmentsManager";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function AppointmentsPage() {
  const rows = await db.appointment.findMany({ orderBy: [{ date: "asc" }, { slot: "asc" }], include: { store: true }, take: 500 });
  return (
    <>
      <PageTitle title="Appointments" description="Boutique visits, try-at-home visits and video consultations." />
      <AppointmentsManager rows={rows.map((a) => ({ ...a, store: a.store?.name ?? null, createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString() }))} />
    </>
  );
}
