import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SESSION_COOKIE, signSession } from "@/lib/session";

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
