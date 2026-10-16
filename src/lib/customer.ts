import "server-only";
import { createHash, randomInt } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { CUSTOMER_COOKIE, signCustomer, verifyCustomer } from "./session";

export async function getCustomerSession() {
  const store = await cookies();
  return verifyCustomer(store.get(CUSTOMER_COOKIE)?.value);
}

export async function getCustomer() {
  const s = await getCustomerSession();
  if (!s) return null;
  return db.customer.findUnique({ where: { id: s.sub } });
}

export async function setCustomerCookie(customer: { id: string; email: string | null; phone: string | null }) {
  const token = await signCustomer({ sub: customer.id, email: customer.email ?? undefined, phone: customer.phone ?? undefined });
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearCustomerCookie() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

const hash = (identifier: string, code: string) => createHash("sha256").update(`${identifier}:${code}:${process.env.AUTH_SECRET || "dev"}`).digest("hex");

export function normalizeIdentifier(raw: string): { kind: "email" | "phone"; value: string } | null {
  const v = raw.trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { kind: "email", value: v };
  const digits = v.replace(/[^0-9]/g, "");
  if (digits.length === 10) return { kind: "phone", value: `91${digits}` };
  if (digits.length >= 11 && digits.length <= 15) return { kind: "phone", value: digits };
  return null;
}

/** Creates a one-time code. Returns null when rate-limited (5 codes / identifier / hour). */
export async function createOtp(identifier: string) {
  const recent = await db.otpCode.count({ where: { identifier, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } } });
  if (recent >= 5) return null;
  const code = String(randomInt(100000, 1000000));
  await db.otpCode.create({ data: { identifier, codeHash: hash(identifier, code), expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
  return code;
}

export async function verifyOtp(identifier: string, code: string) {
  const otp = await db.otpCode.findFirst({ where: { identifier, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  if (!otp || otp.attempts >= 5) return false;
  if (otp.codeHash !== hash(identifier, code.trim())) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  await db.otpCode.deleteMany({ where: { identifier } });
  return true;
}
