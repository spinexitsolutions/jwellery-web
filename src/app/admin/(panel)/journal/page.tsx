import Link from "next/link";
import { Badge, EmptyState, LinkButton, PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function JournalAdmin() {
  const posts = await db.post.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <>
      <PageTitle title="Journal" description="Stories, guides and collection notes." actions={<LinkButton href="/admin/journal/new">+ New story</LinkButton>} />
      {posts.length === 0 ? (
        <EmptyState title="No stories yet" action={<LinkButton href="/admin/journal/new">Write the first one</LinkButton>} />
      ) : (
        <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {posts.map((p) => (
            <Link key={p.id} href={`/admin/journal/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-zinc-50">
              <span className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.coverImage && <img src={p.coverImage} alt="" className="h-full w-full object-cover" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.title}</p>
                <p className="truncate text-sm text-zinc-500">{p.excerpt}</p>
              </div>
              <div className="hidden text-right text-xs text-zinc-500 sm:block">
                <p>{p.category}</p>
                <p>{formatDate(p.publishedAt)}</p>
              </div>
              {p.published ? <Badge tone="green">Live</Badge> : <Badge>Draft</Badge>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
