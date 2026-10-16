import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountDashboard } from "@/components/site/AccountDashboard";
import { LoginPanel } from "@/components/site/LoginPanel";
import { viewProducts } from "@/lib/catalog";
import { getCustomer } from "@/lib/customer";
import { db } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/orders";
import { formatDate, parseJSON } from "@/lib/utils";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer)
    return (
      <Suspense>
        <LoginPanel />
      </Suspense>
    );
  const [orders, addresses, wish, appointments] = await Promise.all([
    db.order.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, include: { returns: true } }),
    db.address.findMany({ where: { customerId: customer.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    db.wishlistItem.findMany({ where: { customerId: customer.id }, include: { product: { include: { collection: true } } }, orderBy: { createdAt: "desc" } }),
    customer.email ? db.appointment.findMany({ where: { email: customer.email }, orderBy: { createdAt: "desc" }, take: 10, include: { store: true } }) : Promise.resolve([]),
  ]);
  const wishlist = await viewProducts(wish.map((w) => w.product).filter((p) => p.published));
  return (
    <Suspense>
    <AccountDashboard
      customer={{ name: customer.name ?? "", email: customer.email ?? "", phone: customer.phone ?? "" }}
      orders={orders.map((o) => ({
        number: o.number,
        key: o.accessKey ?? "",
        date: formatDate(o.createdAt),
        status: o.status,
        statusLabel: STATUS_LABEL[o.status] ?? o.status,
        total: o.total,
        items: parseJSON<{ name: string; image?: string; qty: number }[]>(o.items, []).map((i) => ({ name: i.name, image: i.image ?? "", qty: i.qty })),
        openReturn: o.returns.some((r) => !["rejected", "closed", "refunded", "exchanged"].includes(r.status)),
      }))}
      addresses={addresses.map((a) => ({ id: a.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, pincode: a.pincode, country: a.country, isDefault: a.isDefault }))}
      wishlist={wishlist}
      appointments={appointments.map((a) => ({ id: a.id, type: a.type, date: a.date, slot: a.slot, status: a.status, store: a.store?.name ?? null, meetingLink: a.meetingLink }))}
    />
    </Suspense>
  );
}
