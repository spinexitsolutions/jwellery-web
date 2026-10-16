import { PagesList } from "@/components/admin/PagesList";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { parseJSON } from "@/lib/utils";

export default async function Pages() {
  const pages = await db.page.findMany({ orderBy: [{ slug: "asc" }] });
  const rows = pages
    .map((p) => ({ id: p.id, title: p.title, slug: p.slug, published: p.published, sections: parseJSON<unknown[]>(p.sections, []).length, updatedAt: p.updatedAt.toISOString() }))
    .sort((a, b) => (a.slug === "home" ? -1 : b.slug === "home" ? 1 : 0));
  return (
    <>
      <PageTitle title="Pages" description="Build every page from sections — hero, galleries, 3D, text, forms and more." />
      <PagesList pages={rows} />
    </>
  );
}
