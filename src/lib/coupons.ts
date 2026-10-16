import "server-only";
import { db } from "./db";

export async function validateCoupon(rawCode: string, subtotal: number): Promise<{ ok: true; code: string; discount: number; description: string } | { ok: false; error: string }> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a code." };
  const c = await db.coupon.findUnique({ where: { code } });
  const now = new Date();
  if (!c || !c.active) return { ok: false, error: "This code isn't valid." };
  if (c.startsAt && c.startsAt > now) return { ok: false, error: "This code isn't active yet." };
  if (c.endsAt && c.endsAt < now) return { ok: false, error: "This code has expired." };
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return { ok: false, error: "This code has been fully redeemed." };
  if (subtotal < c.minOrder) return { ok: false, error: `Add items worth ₹${Math.ceil(c.minOrder - subtotal).toLocaleString("en-IN")} more to use this code.` };
  let discount = c.type === "percent" ? (subtotal * c.value) / 100 : c.value;
  if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
  discount = Math.round(Math.min(discount, subtotal));
  return { ok: true, code, discount, description: c.description || (c.type === "percent" ? `${c.value}% off` : `₹${c.value.toLocaleString("en-IN")} off`) };
}
