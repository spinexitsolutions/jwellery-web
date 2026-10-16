import { db } from "@/lib/db";
import { buildInvoicePdf } from "@/lib/invoice";
import { canViewOrder } from "@/lib/orders";

export async function GET(req: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await db.order.findUnique({ where: { number } });
  if (!order || !(await canViewOrder(order, new URL(req.url).searchParams.get("k")))) return new Response("Not found", { status: 404 });
  const bytes = await buildInvoicePdf(order);
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="invoice-${order.number}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
