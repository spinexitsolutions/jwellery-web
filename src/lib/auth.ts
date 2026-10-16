import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function requireAdmin(opts: { role?: "admin" } = {}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (opts.role === "admin" && session.role !== "admin") throw new Error("Only administrators can do this.");
  return session;
}
