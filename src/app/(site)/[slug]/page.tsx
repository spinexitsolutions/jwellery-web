import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SectionRenderer } from "@/components/sections/Renderer";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Section } from "@/lib/sections";
import { parseJSON } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.page.findUnique({ where: { slug } });
  if (!page) return {};
  return { title: page.seoTitle || page.title, description: page.seoDescription || undefined };
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await db.page.findUnique({ where: { slug } });
  // Drafts are visible to logged-in admins for previewing.
  if (!page || (!page.published && !(await getSession()))) notFound();
  return <SectionRenderer sections={parseJSON<Section[]>(page.sections, [])} />;
}
