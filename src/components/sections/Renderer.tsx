import { Suspense } from "react";
import { db } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import type { Section } from "@/lib/sections";
import { viewProducts } from "@/lib/catalog";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Collections } from "./Collections";
import { ContactForm } from "./ContactForm";
import {
  Banner,
  CTA,
  FAQ,
  Gallery,
  HtmlEmbed,
  JournalList,
  Manifesto,
  Marquee,
  Newsletter,
  PageHeader,
  ProductsGrid,
  RichText,
  Stats,
  Steps,
  Story,
  Testimonials,
} from "./Content";
import { Hero } from "./Hero";
import { Showcase3D } from "./Showcase3D";

type D = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function renderOne(section: Section) {
  const data = section.data as D;
  switch (section.type) {
    case "hero":
      return <Hero data={data} />;
    case "marquee":
      return <Marquee data={data} />;
    case "manifesto":
      return <Manifesto data={data} />;
    case "collections": {
      const rows = await db.collection.findMany({
        where: data.onlyFeatured ? { featured: true } : {},
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: { where: { published: true } } } } },
      });
      return <Collections data={data} collections={rows.map((c) => ({ name: c.name, slug: c.slug, tagline: c.tagline, image: c.image, count: c._count.products }))} />;
    }
    case "products": {
      const limit = Number(data.limit) || 8;
      const where =
        data.source === "collection" && data.collection
          ? { published: true, collection: { slug: String(data.collection) } }
          : data.source === "featured"
            ? { published: true, featured: true }
            : { published: true };
      const rows = await db.product.findMany({
        where,
        take: limit,
        orderBy: data.source === "latest" ? { createdAt: "desc" } : { sortOrder: "asc" },
        include: { collection: true },
      });
      return <ProductsGrid data={data} products={await viewProducts(rows)} />;
    }
    case "story":
      return <Story data={{ ...data, bodyHtml: renderMarkdown(data.body) }} />;
    case "showcase3d":
      return <Showcase3D data={data} tone={data.tone} />;
    case "steps":
      return <Steps data={data} />;
    case "stats":
      return <Stats data={data} />;
    case "testimonials":
      return <Testimonials data={data} />;
    case "gallery":
      return <Gallery data={data} />;
    case "journal": {
      const posts = await db.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: Number(data.limit) || 3 });
      return (
        <JournalList
          data={data}
          posts={posts.map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, coverImage: p.coverImage, category: p.category, date: formatDate(p.publishedAt) }))}
        />
      );
    }
    case "banner":
      return <Banner data={data} />;
    case "cta":
      return <CTA data={data} />;
    case "newsletter":
      return <Newsletter data={data} />;
    case "faq":
      return <FAQ data={data} />;
    case "pageHeader":
      return <PageHeader data={data} />;
    case "richText":
      return <RichText data={{ ...data, contentHtml: renderMarkdown(data.content) }} />;
    case "contactForm":
      return (
        <Suspense>
          <ContactForm data={data} />
        </Suspense>
      );
    case "html":
      return <HtmlEmbed data={data} />;
    default:
      return null;
  }
}

export async function SectionRenderer({ sections }: { sections: Section[] }) {
  const visible = sections.filter((s) => !s.hidden);
  const rendered = await Promise.all(visible.map(renderOne));
  return (
    <>
      {visible.map((s, i) => {
        const tone = (s.data as D).tone as string | undefined;
        return (
          <section key={s.id} id={`s-${s.id}`} data-section={s.type} className={cn("relative", tone === "surface" && "tone-surface", tone === "dark" && "tone-dark")}>
            {rendered[i]}
          </section>
        );
      })}
    </>
  );
}
