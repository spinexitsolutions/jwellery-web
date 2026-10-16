import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { db } from "@/lib/db";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "new") return <PostForm id={null} />;
  const p = await db.post.findUnique({ where: { id } });
  if (!p) notFound();
  return (
    <PostForm
      id={p.id}
      initial={{
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt ?? "",
        content: p.content,
        coverImage: p.coverImage ?? "",
        author: p.author ?? "",
        category: p.category ?? "",
        published: p.published,
        publishedAt: p.publishedAt.toISOString().slice(0, 10),
      }}
    />
  );
}
