import "server-only";
import type { Order } from "@prisma/client";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { getSetting } from "./settings";
import { parseJSON } from "./utils";

// Standard PDF fonts only cover Latin-1; map the few symbols we use and drop the rest.
function clean(s: string | null | undefined) {
  return String(s ?? "")
    .replace(/₹/g, "Rs. ")
    .replace(/[·•]/g, "-")
    .replace(/[—–]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function two(n: number) {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}
function three(n: number) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", r ? two(r) : ""].filter(Boolean).join(" ");
}
/** Indian numbering: crore, lakh, thousand. */
export function amountInWords(amount: number) {
  let n = Math.round(amount);
  if (n === 0) return "Zero Rupees Only";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1e3);
  n %= 1e3;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (n) parts.push(three(n));
  return `${parts.join(" ")} Rupees Only`;
}

const money = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function buildInvoicePdf(order: Order) {
  const [site, commerce] = await Promise.all([getSetting("site"), getSetting("commerce")]);
  const items = parseJSON<{ name: string; qty: number; price: number; variant?: string; sku?: string; huid?: string; hsn?: string }[]>(order.items, []);
  const addr = parseJSON<Record<string, string>>(order.address, {});

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const ink = rgb(0.09, 0.075, 0.06);
  const muted = rgb(0.45, 0.42, 0.38);
  const gold = rgb(0.66, 0.51, 0.29);
  const line = rgb(0.85, 0.82, 0.76);
  const W = page.getWidth();
  const M = 48;

  const text = (p: PDFPage, s: string, x: number, y: number, opts: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb>; align?: "left" | "right" } = {}) => {
    const size = opts.size ?? 9;
    const f = opts.f ?? font;
    const str = clean(s);
    const w = f.widthOfTextAtSize(str, size);
    p.drawText(str, { x: opts.align === "right" ? x - w : x, y, size, font: f, color: opts.color ?? ink });
  };
  const wrap = (s: string, f: PDFFont, size: number, max: number) => {
    const words = clean(s).split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(t, size) > max && cur) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  let y = 841.89 - M;
  text(page, site.brandName, M, y - 18, { size: 26, f: serif });
  text(page, "TAX INVOICE", W - M, y - 8, { size: 11, f: bold, align: "right", color: gold });
  text(page, `Invoice No: ${order.invoiceNumber ?? order.number}`, W - M, y - 24, { align: "right" });
  text(page, `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, W - M, y - 36, { align: "right" });
  text(page, `Order: ${order.number}`, W - M, y - 48, { align: "right" });

  y -= 42;
  text(page, commerce.legalName || site.brandName, M, y, { f: bold });
  wrap(site.address, font, 9, 260).forEach((l, i) => text(page, l, M, y - 12 - i * 11, { color: muted }));
  y -= 12 + wrap(site.address, font, 9, 260).length * 11;
  if (commerce.gstin) text(page, `GSTIN: ${commerce.gstin}`, M, y, { f: bold });
  text(page, `${site.email} | ${site.phone}`, M, y - 12, { color: muted });

  y -= 40;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: line });
  y -= 18;
  text(page, "BILL TO / SHIP TO", M, y, { size: 8, f: bold, color: muted });
  const sameState = (addr.state || "").trim().toLowerCase() === commerce.businessState.trim().toLowerCase();
  text(page, "PLACE OF SUPPLY", W / 2 + 20, y, { size: 8, f: bold, color: muted });
  y -= 14;
  text(page, order.customerName, M, y, { f: bold });
  text(page, addr.state || "-", W / 2 + 20, y, { f: bold });
  const shipLines = [addr.line1, addr.line2, `${addr.city ?? ""}, ${addr.state ?? ""} ${addr.pincode ?? ""}`, addr.country, `${order.phone} | ${order.email}`].filter(Boolean);
  shipLines.forEach((l, i) => text(page, l, M, y - 12 - i * 11, { color: muted }));
  text(page, `Payment: ${order.paymentMethod === "cod" ? "Pay on delivery" : "Online (Razorpay)"} - ${order.paymentStatus}`, W / 2 + 20, y - 12, { color: muted });
  y -= 24 + shipLines.length * 11;

  // Items table
  const cols = { n: M, item: M + 20, hsn: 330, qty: 380, rate: 460, amt: W - M };
  page.drawRectangle({ x: M, y: y - 6, width: W - 2 * M, height: 20, color: rgb(0.95, 0.93, 0.9) });
  text(page, "#", cols.n + 4, y, { f: bold, size: 8 });
  text(page, "ITEM", cols.item, y, { f: bold, size: 8 });
  text(page, "HSN", cols.hsn, y, { f: bold, size: 8 });
  text(page, "QTY", cols.qty, y, { f: bold, size: 8 });
  text(page, "RATE", cols.rate, y, { f: bold, size: 8, align: "right" });
  text(page, "AMOUNT", cols.amt, y, { f: bold, size: 8, align: "right" });
  y -= 22;

  const g = order.taxRate || commerce.gstPercent;
  const divisor = 1 + g / 100;
  items.forEach((it, idx) => {
    const lines = wrap(it.name, bold, 9, 200);
    const sub = [it.variant, it.sku ? `SKU ${it.sku}` : "", it.huid ? `HUID ${it.huid}` : ""].filter(Boolean).join(" | ");
    text(page, String(idx + 1), cols.n + 4, y);
    lines.forEach((l, i) => text(page, l, cols.item, y - i * 11, { f: bold }));
    if (sub) wrap(sub, font, 8, 200).forEach((l, i) => text(page, l, cols.item, y - lines.length * 11 - i * 10, { size: 8, color: muted }));
    text(page, it.hsn || commerce.hsnCode, cols.hsn, y);
    text(page, String(it.qty), cols.qty, y);
    text(page, money(it.price / divisor), cols.rate, y, { align: "right" });
    text(page, money((it.price * it.qty) / divisor), cols.amt, y, { align: "right" });
    y -= Math.max(18, lines.length * 11 + (sub ? 12 : 0) + 8);
    page.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.4, color: line });
  });

  // Totals (all prices are GST-inclusive; show taxable value and tax split)
  y -= 8;
  const taxable = order.total / divisor;
  const tax = order.total - taxable;
  const rows: [string, string, boolean?][] = [["Items (incl. GST)", money(order.subtotal)]];
  if (order.discount) rows.push([`Discount ${order.couponCode ? `(${order.couponCode})` : ""}`, `- ${money(order.discount)}`]);
  if (order.giftWrapFee) rows.push(["Gift wrap", money(order.giftWrapFee)]);
  rows.push(["Shipping", order.shipping ? money(order.shipping) : "Free"]);
  rows.push(["Taxable value", money(taxable)]);
  if (sameState) {
    rows.push([`CGST @ ${g / 2}%`, money(tax / 2)]);
    rows.push([`SGST @ ${g / 2}%`, money(tax / 2)]);
  } else rows.push([`IGST @ ${g}%`, money(tax)]);
  rows.push(["Grand total", money(order.total), true]);
  rows.forEach(([k, v, strong]) => {
    if (strong) {
      y -= 8;
      page.drawLine({ start: { x: 330, y: y + 16 }, end: { x: W - M, y: y + 16 }, thickness: 0.6, color: ink });
    }
    text(page, k, 330, y, { f: strong ? bold : font, size: strong ? 11 : 9 });
    text(page, v, W - M, y, { f: strong ? bold : font, size: strong ? 11 : 9, align: "right" });
    y -= strong ? 18 : 14;
  });
  text(page, `Amount in words: ${amountInWords(order.total)}`, M, y - 6, { f: bold, size: 8.5 });

  // Footer
  const fy = 110;
  page.drawLine({ start: { x: M, y: fy + 40 }, end: { x: W - M, y: fy + 40 }, thickness: 0.6, color: line });
  const notes = [
    "All jewellery is BIS hallmarked. Prices are inclusive of GST.",
    `Returns accepted within ${commerce.returnWindowDays} days of delivery as per our policy. Lifetime exchange at prevailing gold value.`,
    "This is a computer-generated invoice and does not require a signature.",
  ];
  notes.forEach((n, i) => wrap(n, font, 8, W - 2 * M).forEach((l) => text(page, l, M, fy + 24 - i * 11, { size: 8, color: muted })));
  text(page, `For ${commerce.legalName || site.brandName}`, W - M, fy - 20, { f: bold, align: "right" });
  text(page, "Authorised signatory", W - M, fy - 52, { size: 8, color: muted, align: "right" });

  return pdf.save();
}
