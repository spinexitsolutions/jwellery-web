import { ReviewsModeration } from "@/components/admin/ReviewsModeration";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function ReviewsPage() {
  const reviews = await db.review.findMany({ orderBy: { createdAt: "desc" }, include: { product: { select: { name: true, slug: true } } }, take: 500 });
  return (
    <>
      <PageTitle title="Reviews" description="Approve, reject or remove customer reviews." />
      <ReviewsModeration reviews={reviews.map((r) => ({ id: r.id, product: r.product.name, slug: r.product.slug, name: r.name, email: r.email, rating: r.rating, title: r.title, body: r.body, verified: r.verified, status: r.status, createdAt: r.createdAt.toISOString() }))} />
    </>
  );
}
