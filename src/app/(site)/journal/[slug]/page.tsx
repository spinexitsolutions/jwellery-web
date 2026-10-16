import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ParallaxImage, Reveal, SplitText } from "@/components/site/motion";
import { db } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await db.post.findUnique({ where: { slug } });
  return p ? { title: p.title, description: p.excerpt || undefined, openGraph: { images: p.coverImage ? [p.coverImage] : [] } } : {};
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await db.post.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();
  const next = await db.post.findFirst({ where: { published: true, id: { not: post.id } }, orderBy: { publishedAt: "desc" } });
  return (
    <article className="pb-24 pt-36 md:pt-44">
      <header className="site-container max-w-5xl text-center">
        <p className="eyebrow">
          {post.category} · {formatDate(post.publishedAt)}
        </p>
        <SplitText as="h1" immediate text={post.title} className="display mt-6 block text-[clamp(3rem,7vw,7rem)] leading-[0.95]" />
        {post.excerpt && <p className="mx-auto mt-8 max-w-xl text-lg text-muted">{post.excerpt}</p>}
      </header>
      {post.coverImage && (
        <div className="site-container mt-16">
          <ParallaxImage src={post.coverImage} alt={post.title} className="aspect-[16/9] w-full rounded-[var(--radius)]" />
        </div>
      )}
      <Reveal className="site-container mt-16">
        <div className="prose-site mx-auto max-w-2xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
        <p className="mx-auto mt-12 max-w-2xl text-sm text-muted">— {post.author}</p>
      </Reveal>
      {next && (
        <Link href={`/journal/${next.slug}`} className="site-container group mt-24 block border-t border-line pt-12" data-cursor="Read">
          <p className="eyebrow">Next story</p>
          <p className="display mt-4 text-[clamp(2.4rem,6vw,6rem)] leading-none transition-colors group-hover:text-accent">{next.title} →</p>
        </Link>
      )}
    </article>
  );
}
