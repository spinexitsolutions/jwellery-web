// Edge-safe session helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "kaaya_admin";
export const CUSTOMER_COOKIE = "kaaya_customer";

export type SessionPayload = { sub: string; email: string; name: string; role: string };
export type CustomerPayload = { sub: string; email?: string; phone?: string };

function secret() {
  const s = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
  return new TextEncoder().encode(s);
}

async function sign(payload: Record<string, unknown>, audience: string, expires: string) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setAudience(audience).setIssuedAt().setExpirationTime(expires).sign(secret());
}

async function verify<T>(token: string | undefined, audience: string): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { audience });
    return payload as unknown as T;
  } catch {
    return null;
  }
}

export const signSession = (p: SessionPayload) => sign(p, "admin", "7d");
export const verifySession = (t: string | undefined) => verify<SessionPayload>(t, "admin");
export const signCustomer = (p: CustomerPayload) => sign(p, "customer", "30d");
export const verifyCustomer = (t: string | undefined) => verify<CustomerPayload>(t, "customer");
