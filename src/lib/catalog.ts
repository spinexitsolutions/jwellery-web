import "server-only";
import type { Collection, Product } from "@prisma/client";
import { db } from "./db";
import { getRateMap } from "./rates";
import { getSetting } from "./settings";
import { toProductView, type PricingContext, type ProductView } from "./types";

export async function getPricingContext(): Promise<PricingContext> {
  const [rates, commerce] = await Promise.all([getRateMap(), getSetting("commerce")]);
  return { rates, gstPercent: commerce.gstPercent };
}

/** Product views with live prices and approved-review ratings. */
export async function viewProducts(rows: (Product & { collection?: Collection | null })[], ctx?: PricingContext): Promise<ProductView[]> {
  const c = ctx ?? (await getPricingContext());
  const ids = rows.map((r) => r.id);
  const ratings = ids.length
    ? await db.review.groupBy({ by: ["productId"], where: { productId: { in: ids }, status: "approved" }, _avg: { rating: true }, _count: { _all: true } })
    : [];
  return rows.map((r) => {
    const v = toProductView(r, c);
    const rt = ratings.find((x) => x.productId === r.id);
    if (rt && rt._count._all > 0) v.rating = { avg: Math.round((rt._avg.rating ?? 0) * 10) / 10, count: rt._count._all };
    return v;
  });
}
