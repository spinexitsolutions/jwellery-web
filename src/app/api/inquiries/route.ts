import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyAll } from "@/lib/notify";

const schema = z.object({
  type: z.enum(["contact", "appointment", "product"]).default("contact"),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional().default(""),
  subject: z.string().max(200).optional().default(""),
  message: z.string().min(2).max(5000),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please fill in your name, a valid email and a message." }, { status: 400 });
  const inquiry = await db.inquiry.create({ data: parsed.data });
  await notifyAll("inquiry.created", `New ${inquiry.type} from ${inquiry.name}`, { ...parsed.data, id: inquiry.id });
  return NextResponse.json({ ok: true });
}
