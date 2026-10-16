import { notFound } from "next/navigation";
import { PageBuilder } from "@/components/admin/PageBuilder";
import { db } from "@/lib/db";
import type { Section } from "@/lib/sections";
import { parseJSON } from "@/lib/utils";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [page, collections] = await Promise.all([db.page.findUnique({ where: { id } }), db.collection.findMany({ select: { name: true, slug: true }, orderBy: { sortOrder: "asc" } })]);
  if (!page) notFound();
  return (
    <PageBuilder
      page={{ id: page.id, title: page.title, slug: page.slug, seoTitle: page.seoTitle ?? "", seoDescription: page.seoDescription ?? "", published: page.published, showInNav: page.showInNav }}
      initialSections={parseJSON<Section[]>(page.sections, [])}
      collections={collections}
    />
  );
}
