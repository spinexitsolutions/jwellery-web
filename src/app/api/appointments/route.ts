import { NextResponse } from "next/server";
import { z } from "zod";
import { sendCustomerNote } from "@/lib/customer-notify";
import { db } from "@/lib/db";
import { notifyAll } from "@/lib/notify";
import { getSetting } from "@/lib/settings";

const schema = z.object({
  type: z.enum(["store", "home", "video"]),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.string().min(1).max(20),
  storeId: z.string().optional(),
  address: z.string().max(400).optional(),
  pincode: z.string().optional(),
  products: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

const LABEL = { store: "In-store appointment", home: "Try-at-home visit", video: "Video consultation" };

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  const d = parsed.data;
  const c = await getSetting("commerce");

  if (d.type === "home" && !c.tryAtHomeEnabled) return NextResponse.json({ error: "Try-at-home isn't available right now." }, { status: 400 });
  if (d.type === "video" && !c.videoConsultEnabled) return NextResponse.json({ error: "Video consultations aren't available right now." }, { status: 400 });
  if (d.type === "home") {
    if (!d.address || !d.pincode || !/^\d{6}$/.test(d.pincode)) return NextResponse.json({ error: "Please add your address and 6-digit PIN code." }, { status: 400 });
    const allowed = c.tryAtHomePincodes.split(/[\s,]+/).filter(Boolean);
    if (allowed.length && !allowed.some((p) => d.pincode!.startsWith(p))) return NextResponse.json({ error: "Try-at-home isn't available at this PIN code yet — book a video call instead." }, { status: 400 });
  }
  if (d.type === "store" && !d.storeId) return NextResponse.json({ error: "Please choose a store." }, { status: 400 });
  if (!c.appointmentSlots.includes(d.slot)) return NextResponse.json({ error: "Please choose an available time." }, { status: 400 });
  const day = new Date(`${d.date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(day.getTime()) || day < today || day.getTime() - today.getTime() > c.appointmentDaysAhead * 864e5) return NextResponse.json({ error: "Please choose a date within the booking window." }, { status: 400 });

  const store = d.storeId ? await db.store.findUnique({ where: { id: d.storeId } }) : null;
  const taken = await db.appointment.count({ where: { date: d.date, slot: d.slot, type: d.type, storeId: d.storeId ?? null, status: { not: "cancelled" } } });
  if (taken >= 2) return NextResponse.json({ error: "That time is fully booked — please pick another slot." }, { status: 409 });

  const appt = await db.appointment.create({ data: { ...d, storeId: store?.id ?? null } });
  const when = `${day.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} at ${d.slot}`;
  await notifyAll("appointment.created", `${LABEL[d.type]} request from ${d.name}`, { type: d.type, name: d.name, phone: d.phone, email: d.email, when, store: store?.name ?? "", id: appt.id });
  await sendCustomerNote({ email: d.email, phone: d.phone }, `${LABEL[d.type]} requested`, `Thank you, ${d.name.split(" ")[0]}. We've received your request for ${when}${store ? ` at ${store.name}` : ""}. Our concierge will confirm shortly.`);
  return NextResponse.json({ ok: true });
}
