import type { Metadata } from "next";
import { Checkout } from "@/components/site/Checkout";
import { getCustomer } from "@/lib/customer";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [customer, commerce] = await Promise.all([getCustomer(), getSetting("commerce")]);
  const addresses = customer ? await db.address.findMany({ where: { customerId: customer.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) : [];
  return (
    <Checkout
      customer={customer ? { name: customer.name ?? "", email: customer.email ?? "", phone: customer.phone ? customer.phone.replace(/^91(?=\d{10}$)/, "") : "" } : null}
      addresses={addresses.map((a) => ({ id: a.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, pincode: a.pincode, country: a.country }))}
      giftWrap={{ enabled: commerce.giftWrapEnabled, fee: commerce.giftWrapFee }}
      gstPercent={commerce.gstPercent}
    />
  );
}
