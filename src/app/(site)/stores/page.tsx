import type { Metadata } from "next";
import { StoreLocator } from "@/components/site/StoreLocator";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Boutiques", description: "Find a boutique near you and book a private appointment." };

export default async function StoresPage() {
  const stores = await db.store.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { city: "asc" }] });
  return <StoreLocator stores={stores.map((s) => ({ id: s.id, name: s.name, city: s.city, address: s.address, phone: s.phone, email: s.email, hours: s.hours, image: s.image, lat: s.lat, lng: s.lng, mapUrl: s.mapUrl, services: s.services.split(",").map((x) => x.trim()) }))} />;
}
