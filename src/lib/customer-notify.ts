import "server-only";
import type { Order } from "@prisma/client";
import { sendMail, sendSms } from "./notify";
import { getSetting } from "./settings";
import { formatPrice, parseJSON } from "./utils";

function layout(brand: string, title: string, body: string) {
  return `<div style="background:#f3eee6;padding:32px 0;font-family:Georgia,serif;color:#16130f">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:36px">
    <p style="font-size:26px;margin:0 0 24px;letter-spacing:-0.5px">${brand}</p>
    <h1 style="font-size:24px;font-weight:normal;margin:0 0 16px">${title}</h1>
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#4a443c">${body}</div>
  </div></div>`;
}

const STATUS_COPY: Record<string, string> = {
  confirmed: "Your order is confirmed and being prepared in our atelier.",
  shipped: "Your order has left the atelier and is on its way, fully insured.",
  out_for_delivery: "Your order is out for delivery today.",
  delivered: "Your order has been delivered. We hope you love it.",
  cancelled: "Your order has been cancelled. If you paid online, the refund will reach you in 5–7 working days.",
};

async function baseUrl() {
  return process.env.SITE_URL?.replace(/\/$/, "") || "";
}

export async function sendOrderConfirmation(order: Order) {
  const site = await getSetting("site");
  const items = parseJSON<{ name: string; qty: number; price: number; variant?: string }[]>(order.items, []);
  const fmt = (n: number) => formatPrice(n, site.currency, site.locale);
  const rows = items
    .map((i) => `<tr><td style="padding:8px 0">${i.name}${i.variant ? `<br><span style="color:#999;font-size:12px">${i.variant}</span>` : ""} × ${i.qty}</td><td style="text-align:right">${fmt(i.price * i.qty)}</td></tr>`)
    .join("");
  const url = `${await baseUrl()}/order/${order.number}?k=${order.accessKey ?? ""}`;
  const html = layout(
    site.brandName,
    `Thank you, ${order.customerName.split(" ")[0]}.`,
    `<p>We've received your order <b>${order.number}</b>.</p>
     <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:16px 0">${rows}</table>
     ${order.discount ? `<p>Discount (${order.couponCode}): −${fmt(order.discount)}</p>` : ""}
     <p style="font-size:16px"><b>Total: ${fmt(order.total)}</b> · ${order.paymentMethod === "cod" ? "Pay on delivery" : "Paid online"}</p>
     <p><a href="${url}" style="color:#a9824b">View your order & invoice</a></p>`,
  );
  await Promise.allSettled([
    sendMail({ to: order.email, subject: `Order ${order.number} confirmed — ${site.brandName}`, html }),
    sendSms(order.phone, `${site.brandName}: order ${order.number} received. Total ${fmt(order.total)}. Track: ${url}`),
  ]);
}

export async function sendOrderStatus(order: Order) {
  const site = await getSetting("site");
  const copy = STATUS_COPY[order.status];
  if (!copy) return;
  const url = `${await baseUrl()}/track?order=${order.number}`;
  const tracking = order.awb ? `<p>Courier: <b>${order.courier ?? ""}</b> · AWB <b>${order.awb}</b>${order.trackingUrl ? ` · <a href="${order.trackingUrl}" style="color:#a9824b">Track shipment</a>` : ""}</p>` : "";
  await Promise.allSettled([
    sendMail({ to: order.email, subject: `Order ${order.number}: ${order.status.replace(/_/g, " ")}`, html: layout(site.brandName, `Order ${order.number}`, `<p>${copy}</p>${tracking}<p><a href="${url}" style="color:#a9824b">Track your order</a></p>`) }),
    sendSms(order.phone, `${site.brandName}: ${copy}${order.awb ? ` AWB ${order.awb}.` : ""} ${url}`),
  ]);
}

export async function sendOtpMessage(kind: "email" | "phone", to: string, code: string) {
  const site = await getSetting("site");
  if (kind === "email") return sendMail({ to, subject: `${code} is your ${site.brandName} sign-in code`, html: layout(site.brandName, "Your sign-in code", `<p style="font-size:32px;letter-spacing:8px;color:#16130f"><b>${code}</b></p><p>It expires in 10 minutes. If you didn't request it, you can ignore this email.</p>`) });
  return sendSms(to, `${code} is your ${site.brandName} sign-in code. Valid for 10 minutes.`);
}

export async function sendCustomerNote(to: { email: string; phone?: string | null }, subject: string, message: string) {
  const site = await getSetting("site");
  await Promise.allSettled([sendMail({ to: to.email, subject: `${subject} — ${site.brandName}`, html: layout(site.brandName, subject, `<p>${message}</p>`) }), to.phone ? sendSms(to.phone, `${site.brandName}: ${message}`) : Promise.resolve(false)]);
}
