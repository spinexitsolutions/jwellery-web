import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fireWebhooks } from "@/lib/notify";

export async function POST(req: Request) {
  const parsed = z.object({ email: z.string().email().max(200) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  await db.subscriber.upsert({ where: { email }, update: {}, create: { email } });
  await fireWebhooks("newsletter.subscribed", { email });
  return NextResponse.json({ ok: true });
}
