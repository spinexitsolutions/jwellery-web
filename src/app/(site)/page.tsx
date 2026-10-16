import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SectionRenderer } from "@/components/sections/Renderer";
import { db } from "@/lib/db";
import type { Section } from "@/lib/sections";
import { parseJSON } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const page = await db.page.findUnique({ where: { slug: "home" } });
  return { title: page?.seoTitle ? { absolute: page.seoTitle } : undefined, description: page?.seoDescription || undefined };
}

export default async function Home() {
  const page = await db.page.findUnique({ where: { slug: "home" } });
  if (!page) notFound();
  return <SectionRenderer sections={parseJSON<Section[]>(page.sections, [])} />;
}
