import { NavigationEditor } from "@/components/admin/NavigationEditor";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";

export default async function NavigationPage() {
  const [nav, pages, collections] = await Promise.all([
    getSetting("navigation"),
    db.page.findMany({ select: { title: true, slug: true } }),
    db.collection.findMany({ select: { name: true, slug: true } }),
  ]);
  const suggestions = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Collections", href: "/collections" },
    { label: "Journal", href: "/journal" },
    ...pages.filter((p) => p.slug !== "home").map((p) => ({ label: p.title, href: `/${p.slug}` })),
    ...collections.map((c) => ({ label: c.name, href: `/collections/${c.slug}` })),
  ];
  return (
    <>
      <PageTitle title="Navigation" description="Menus in the header and footer." />
      <NavigationEditor initial={nav} suggestions={suggestions} />
    </>
  );
}
