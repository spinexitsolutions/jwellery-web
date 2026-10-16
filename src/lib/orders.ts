import "server-only";
import type { Order } from "@prisma/client";
import { db } from "./db";
import { getSetting } from "./settings";
import { parseJSON } from "./utils";

export type TimelineEntry = { status: string; note?: string; at: string };

export const ORDER_STEPS = ["placed", "confirmed", "shipped", "out_for_delivery", "delivered"] as const;
export const STATUS_LABEL: Record<string, string> = {
  pending: "Order placed",
  placed: "Order placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function timelineOf(order: Pick<Order, "timeline">) {
  return parseJSON<TimelineEntry[]>(order.timeline, []);
}

export function withTimeline(order: Pick<Order, "timeline">, status: string, note?: string) {
  return JSON.stringify([...timelineOf(order), { status, note, at: new Date().toISOString() }]);
}

export async function nextInvoiceNumber() {
  const { invoicePrefix } = await getSetting("commerce");
  const year = new Date().getFullYear();
  const count = await db.order.count({ where: { invoiceNumber: { startsWith: `${invoicePrefix}${year}-` } } });
  return `${invoicePrefix}${year}-${String(count + 1).padStart(5, "0")}`;
}

/** An order is visible to admins, the customer who owns it, or anyone holding its access key (from emails / checkout). */
export async function canViewOrder(order: Pick<Order, "customerId" | "accessKey">, key?: string | null) {
  const { getSession } = await import("./auth");
  const { getCustomerSession } = await import("./customer");
  if (key && order.accessKey && key === order.accessKey) return true;
  const c = await getCustomerSession();
  if (c && order.customerId === c.sub) return true;
  return !!(await getSession());
}
