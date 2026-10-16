"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCustomerSession } from "@/lib/customer";
import { db } from "@/lib/db";

async function me() {
  const s = await getCustomerSession();
  if (!s) throw new Error("Please sign in again.");
  return s.sub;
}

export async function updateProfile(input: { name: string; email?: string }) {
  const id = await me();
  const d = z.object({ name: z.string().min(1).max(120), email: z.string().email().optional().or(z.literal("")) }).safeParse(input);
  if (!d.success) return { error: "Please enter your name and a valid email." };
  try {
    await db.customer.update({ where: { id }, data: { name: d.data.name, ...(d.data.email ? { email: d.data.email.toLowerCase() } : {}) } });
  } catch {
    return { error: "That email is already linked to another account." };
  }
  revalidatePath("/account");
  return { ok: true };
}

const addressInput = z.object({
  label: z.string().max(30).default("Home"),
  name: z.string().min(1),
  phone: z.string().min(6),
  line1: z.string().min(2),
  line2: z.string().optional().default(""),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits"),
  country: z.string().default("India"),
});

export async function saveAddress(id: string | null, input: z.input<typeof addressInput>) {
  const customerId = await me();
  const d = addressInput.safeParse(input);
  if (!d.success) return { error: d.error.issues[0]?.message ?? "Please complete the address." };
  if (id) {
    const a = await db.address.findFirst({ where: { id, customerId } });
    if (!a) return { error: "Address not found." };
    await db.address.update({ where: { id }, data: d.data });
  } else {
    const count = await db.address.count({ where: { customerId } });
    await db.address.create({ data: { ...d.data, customerId, isDefault: count === 0 } });
  }
  revalidatePath("/account");
  return { ok: true };
}

export async function deleteAddress(id: string) {
  const customerId = await me();
  await db.address.deleteMany({ where: { id, customerId } });
  revalidatePath("/account");
  return { ok: true };
}

export async function makeDefaultAddress(id: string) {
  const customerId = await me();
  await db.address.updateMany({ where: { customerId }, data: { isDefault: false } });
  await db.address.updateMany({ where: { id, customerId }, data: { isDefault: true } });
  revalidatePath("/account");
  return { ok: true };
}
