import { InquiriesView } from "@/components/admin/InquiriesView";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function Inquiries({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const [inquiries, subscribers] = await Promise.all([db.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 300 }), db.subscriber.findMany({ orderBy: { createdAt: "desc" } })]);
  return (
    <>
      <PageTitle title="Inquiries" description="Messages, appointment requests and newsletter subscribers." />
      <InquiriesView
        initialTab={tab === "subscribers" ? "subscribers" : "inquiries"}
        inquiries={inquiries.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }))}
        subscribers={subscribers.map((s) => ({ id: s.id, email: s.email, createdAt: s.createdAt.toISOString() }))}
      />
    </>
  );
}
