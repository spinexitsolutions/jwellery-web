import type { Metadata } from "next";
import Link from "next/link";
import { Reveal, SafeImage, SplitText } from "@/components/site/motion";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Journal" };

export default async function Journal() {
  const posts = await db.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } });
  const [lead, ...rest] = posts;
  return (
    <div className="site-container pb-32 pt-36 md:pt-44">
      <p className="eyebrow">Journal</p>
      <SplitText as="h1" immediate text="Notes from *the bench*" className="display mt-5 block text-[clamp(3.4rem,10vw,10rem)] leading-[0.88]" />
      {lead && (
        <Reveal className="mt-20">
          <Link href={`/journal/${lead.slug}`} className="group grid gap-8 md:grid-cols-12 md:items-end" data-cursor="Read">
            <div className="overflow-hidden rounded-[var(--radius)] md:col-span-8">
              <SafeImage src={lead.coverImage} alt={lead.title} className="aspect-[16/10] w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105" />
            </div>
            <div className="md:col-span-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                {lead.category} · {formatDate(lead.publishedAt)}
              </p>
              <h2 className="display mt-4 text-5xl leading-tight group-hover:text-accent">{lead.title}</h2>
              <p className="mt-4 text-muted">{lead.excerpt}</p>
            </div>
          </Link>
        </Reveal>
      )}
      <div className="mt-24 grid gap-14 md:grid-cols-3 md:gap-8">
        {rest.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.08}>
            <Link href={`/journal/${p.slug}`} className="group block" data-cursor="Read">
              <div className="overflow-hidden rounded-[var(--radius)]">
                <SafeImage src={p.coverImage} alt={p.title} className="aspect-[4/3] w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105" />
              </div>
              <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-muted">
                {p.category} · {formatDate(p.publishedAt)}
              </p>
              <h3 className="display mt-3 text-3xl leading-tight group-hover:text-accent">{p.title}</h3>
              <p className="mt-3 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
