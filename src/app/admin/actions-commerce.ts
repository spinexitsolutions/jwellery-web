"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sendCustomerNote, sendOrderStatus } from "@/lib/customer-notify";
import { db } from "@/lib/db";
import { shiprocketFetch } from "@/lib/delivery";
import { withTimeline } from "@/lib/orders";
import { saveSetting, getSetting } from "@/lib/settings";
import type { CommerceSettings } from "@/lib/settings-types";
import { parseJSON } from "@/lib/utils";

type Result<T = unknown> = { ok: true; data?: T } | { ok?: false; error: string };

function fail(e: unknown): { error: string } {
  if (e instanceof z.ZodError) return { error: e.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join(", ") };
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("Unique constraint")) return { error: "That code / value is already in use." };
  return { error: msg };
}

/* ---------------- Commerce settings ---------------- */
export async function saveCommerce(value: CommerceSettings): Promise<Result> {
  await requireAdmin();
  await saveSetting("commerce", value);
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------- Coupons ---------------- */
const couponInput = z.object({
  code: z.string().min(2).max(40),
  description: z.string().optional().nullable(),
  type: z.enum(["percent", "flat"]),
  value: z.coerce.number().positive(),
  minOrder: z.coerce.number().min(0),
  maxDiscount: z.coerce.number().positive().nullable().optional(),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  active: z.boolean(),
});

export async function saveCoupon(id: string | null, input: z.input<typeof couponInput>): Promise<Result> {
  await requireAdmin();
  try {
    const d = couponInput.parse(input);
    if (d.type === "percent" && d.value > 90) return { error: "Percentage discounts are capped at 90%." };
    const data = {
      ...d,
      code: d.code.trim().toUpperCase().replace(/\s+/g, ""),
      maxDiscount: d.maxDiscount || null,
      usageLimit: d.usageLimit || null,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(`${d.endsAt}T23:59:59`) : null,
    };
    if (id) await db.coupon.update({ where: { id }, data });
    else await db.coupon.create({ data });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCoupon(id: string): Promise<Result> {
  await requireAdmin();
  await db.coupon.delete({ where: { id } });
  return { ok: true };
}

/* ---------------- Reviews ---------------- */
export async function moderateReview(id: string, status: "approved" | "rejected"): Promise<Result> {
  await requireAdmin();
  const r = await db.review.update({ where: { id }, data: { status }, include: { product: true } });
  revalidatePath(`/shop/${r.product.slug}`);
  return { ok: true };
}

export async function deleteReview(id: string): Promise<Result> {
  await requireAdmin();
  await db.review.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------- Orders: fulfilment ---------------- */
export async function updateFulfilment(
  id: string,
  input: { status: string; paymentStatus: string; courier?: string; awb?: string; trackingUrl?: string; note?: string; notify: boolean; huids?: Record<number, string> },
): Promise<Result> {
  await requireAdmin();
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  const statusChanged = input.status !== order.status;
  let items = order.items;
  if (input.huids) {
    const list = parseJSON<Record<string, unknown>[]>(order.items, []);
    Object.entries(input.huids).forEach(([i, v]) => {
      if (list[Number(i)]) list[Number(i)].huid = v.trim().toUpperCase() || undefined;
    });
    items = JSON.stringify(list);
  }
  const updated = await db.order.update({
    where: { id },
    data: {
      status: input.status,
      paymentStatus: input.paymentStatus,
      courier: input.courier || null,
      awb: input.awb || null,
      trackingUrl: input.trackingUrl || null,
      items,
      ...(statusChanged || input.note ? { timeline: withTimeline(order, input.status, input.note || undefined) } : {}),
    },
  });
  if (statusChanged && input.notify) await sendOrderStatus(updated);
  return { ok: true };
}

export async function createShiprocketShipment(id: string): Promise<Result<{ awb?: string }>> {
  await requireAdmin();
  try {
    const [order, i] = await Promise.all([db.order.findUniqueOrThrow({ where: { id } }), getSetting("integrations")]);
    if (order.shipmentId) return { error: "A shipment already exists for this order." };
    const a = parseJSON<Record<string, string>>(order.address, {});
    const items = parseJSON<{ name: string; sku?: string; qty: number; price: number; hsn?: string }[]>(order.items, []);
    const [first, ...rest] = order.customerName.split(" ");
    const created = await shiprocketFetch("/orders/create/adhoc", {
      method: "POST",
      body: JSON.stringify({
        order_id: order.number,
        order_date: order.createdAt.toISOString().slice(0, 16).replace("T", " "),
        pickup_location: i.shiprocketPickupLocation,
        billing_customer_name: first,
        billing_last_name: rest.join(" ") || "-",
        billing_address: a.line1,
        billing_address_2: a.line2 || "",
        billing_city: a.city,
        billing_pincode: a.pincode,
        billing_state: a.state,
        billing_country: a.country || "India",
        billing_email: order.email,
        billing_phone: order.phone.replace(/[^0-9]/g, "").slice(-10),
        shipping_is_billing: true,
        order_items: items.map((x, k) => ({ name: x.name, sku: x.sku || `ITEM-${k + 1}`, units: x.qty, selling_price: x.price, hsn: x.hsn || "7113" })),
        payment_method: order.paymentMethod === "cod" && order.paymentStatus !== "paid" ? "COD" : "Prepaid",
        sub_total: order.total,
        length: 12,
        breadth: 10,
        height: 6,
        weight: 0.5,
      }),
    });
    const shipmentId = String(created.shipment_id ?? "");
    let awb: string | undefined;
    let courier: string | undefined;
    if (shipmentId) {
      try {
        const assigned = await shiprocketFetch("/courier/assign/awb", { method: "POST", body: JSON.stringify({ shipment_id: shipmentId }) });
        awb = assigned?.response?.data?.awb_code;
        courier = assigned?.response?.data?.courier_name;
      } catch {}
    }
    await db.order.update({
      where: { id },
      data: { shipmentId, awb: awb ?? order.awb, courier: courier ?? order.courier, trackingUrl: awb ? `https://shiprocket.co/tracking/${awb}` : order.trackingUrl },
    });
    return { ok: true, data: { awb } };
  } catch (e) {
    return fail(e);
  }
}

/* ---------------- Returns ---------------- */
export async function updateReturn(id: string, status: string, adminNote: string, notify: boolean): Promise<Result> {
  await requireAdmin();
  const r = await db.returnRequest.update({ where: { id }, data: { status, adminNote: adminNote || null }, include: { order: true } });
  if (notify) await sendCustomerNote({ email: r.order.email, phone: r.order.phone }, `Your ${r.type} request — ${status.replace(/_/g, " ")}`, adminNote || `Your ${r.type} request for order ${r.order.number} is now ${status.replace(/_/g, " ")}.`);
  return { ok: true };
}

/* ---------------- Appointments ---------------- */
export async function updateAppointment(id: string, input: { status: string; meetingLink?: string; notify: boolean }): Promise<Result> {
  await requireAdmin();
  const a = await db.appointment.update({ where: { id }, data: { status: input.status, meetingLink: input.meetingLink || null }, include: { store: true } });
  if (input.notify) {
    const when = `${new Date(`${a.date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} at ${a.slot}`;
    const msg =
      a.status === "confirmed"
        ? `Your appointment on ${when}${a.store ? ` at ${a.store.name}` : ""} is confirmed.${a.meetingLink ? ` Join here: ${a.meetingLink}` : ""}`
        : a.status === "cancelled"
          ? `Your appointment on ${when} has been cancelled. Reply to rebook any time.`
          : `Your appointment on ${when} is now ${a.status}.`;
    await sendCustomerNote({ email: a.email, phone: a.phone }, "Your appointment", msg);
  }
  return { ok: true };
}

export async function deleteAppointment(id: string): Promise<Result> {
  await requireAdmin();
  await db.appointment.delete({ where: { id } });
  return { ok: true };
}

/* ---------------- Stores ---------------- */
const storeInput = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  hours: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  lat: z.coerce.number().nullable().optional(),
  lng: z.coerce.number().nullable().optional(),
  mapUrl: z.string().optional().nullable(),
  services: z.string(),
  sortOrder: z.coerce.number().int(),
  active: z.boolean(),
});

export async function saveStore(id: string | null, input: z.input<typeof storeInput>): Promise<Result> {
  await requireAdmin();
  try {
    const d = storeInput.parse(input);
    const data = { ...d, lat: d.lat || null, lng: d.lng || null };
    if (id) await db.store.update({ where: { id }, data });
    else await db.store.create({ data });
    revalidatePath("/stores");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteStore(id: string): Promise<Result> {
  await requireAdmin();
  await db.store.delete({ where: { id } });
  revalidatePath("/stores");
  return { ok: true };
}
