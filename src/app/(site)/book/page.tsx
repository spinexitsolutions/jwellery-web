import type { Metadata } from "next";
import { Suspense } from "react";
import { BookAppointment } from "@/components/site/BookAppointment";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";

export const metadata: Metadata = { title: "Book an appointment", description: "Visit a boutique, try pieces at home, or speak to a designer on a video call." };

export default async function BookPage() {
  const [stores, c, products] = await Promise.all([
    db.store.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }] }),
    getSetting("commerce"),
    db.product.findMany({ where: { published: true }, select: { name: true, slug: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <Suspense>
      <BookAppointment
        stores={stores.map((s) => ({ id: s.id, name: s.name, city: s.city }))}
        slots={c.appointmentSlots}
        daysAhead={c.appointmentDaysAhead}
        homeEnabled={c.tryAtHomeEnabled}
        videoEnabled={c.videoConsultEnabled}
        products={products}
      />
    </Suspense>
  );
}
