import { NextResponse } from "next/server";
import { createOtp, normalizeIdentifier } from "@/lib/customer";
import { sendOtpMessage } from "@/lib/customer-notify";
import { emailConfigured, smsConfigured } from "@/lib/notify";

export async function POST(req: Request) {
  const { identifier } = (await req.json().catch(() => ({}))) as { identifier?: string };
  const id = normalizeIdentifier(String(identifier ?? ""));
  if (!id) return NextResponse.json({ error: "Enter a valid email or 10-digit mobile number." }, { status: 400 });
  const canSend = id.kind === "email" ? await emailConfigured() : await smsConfigured();
  const isDev = process.env.NODE_ENV !== "production";
  if (!canSend && !isDev) {
    return NextResponse.json({ error: id.kind === "phone" ? "Mobile sign-in isn't available yet — please use your email." : "Email sign-in isn't set up yet. Please contact us." }, { status: 400 });
  }
  const code = await createOtp(id.value);
  if (!code) return NextResponse.json({ error: "Too many attempts. Please try again in an hour." }, { status: 429 });
  const sent = canSend ? await sendOtpMessage(id.kind, id.value, code) : false;
  if (!sent && !isDev) return NextResponse.json({ error: "We couldn't send the code. Please try again." }, { status: 502 });
  // In development without SMTP/SMS configured, return the code so the flow can be tested.
  return NextResponse.json({ ok: true, channel: id.kind, ...(isDev && !sent ? { devCode: code } : {}) });
}
