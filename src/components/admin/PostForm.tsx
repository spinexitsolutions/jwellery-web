"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePost, savePost } from "@/app/admin/actions";
import { cn, slugify } from "@/lib/utils";
import { ImageField } from "./fields";
import { Button, Card, Input, Label, PageTitle, Textarea, Toggle, useAction } from "./ui";

type P = { title: string; slug: string; excerpt: string; content: string; coverImage: string; author: string; category: string; published: boolean; publishedAt: string };

export function PostForm({ id, initial }: { id: string | null; initial?: P }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [v, setV] = useState<P>(initial ?? { title: "", slug: "", excerpt: "", content: "", coverImage: "", author: "", category: "", published: true, publishedAt: new Date().toISOString().slice(0, 10) });
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [html, setHtml] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await run(() => savePost(id, v), "Story saved");
        if (r && "data" in r && r.data && !id) router.replace(`/admin/journal/${r.data.id}`);
        else router.refresh();
      }}
    >
      <PageTitle
        title={id ? "Edit story" : "New story"}
        back={{ href: "/admin/journal", label: "Journal" }}
        actions={
          <>
            {id && (
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  if (!confirm("Delete this story?")) return;
                  await run(() => deletePost(id), "Deleted");
                  router.push("/admin/journal");
                }}
              >
                Delete
              </Button>
            )}
            <Button loading={pending}>Save</Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="space-y-5">
              <Input required value={v.title} placeholder="Title" onChange={(e) => setV({ ...v, title: e.target.value, slug: id ? v.slug : slugify(e.target.value) })} className="h-12 text-lg font-medium" />
              <div>
                <Label>Excerpt</Label>
                <Textarea rows={2} value={v.excerpt} onChange={(e) => setV({ ...v, excerpt: e.target.value })} />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label help="Markdown: ## heading, **bold**, *italic*, > quote, - list, ![alt](image-url)">Content</Label>
                  <div className="flex rounded-lg border border-zinc-200 p-0.5 text-xs">
                    {(["write", "preview"] as const).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={async () => {
                          setTab(t);
                          if (t === "preview") {
                            const { marked } = await import("marked");
                            setHtml(marked.parse(v.content, { async: false }) as string);
                          }
                        }}
                        className={cn("rounded-md px-3 py-1 capitalize", tab === t && "bg-zinc-900 text-white")}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {tab === "write" ? (
                  <Textarea rows={20} value={v.content} onChange={(e) => setV({ ...v, content: e.target.value })} className="font-mono text-[13px]" />
                ) : (
                  <div className="prose-admin min-h-[400px] rounded-lg border border-zinc-200 p-5 text-sm leading-relaxed [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3" dangerouslySetInnerHTML={{ __html: html }} />
                )}
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Publishing">
            <div className="space-y-4">
              <Toggle label="Published" checked={v.published} onChange={(published) => setV({ ...v, published })} />
              <div>
                <Label>Date</Label>
                <Input type="date" value={v.publishedAt} onChange={(e) => setV({ ...v, publishedAt: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })} placeholder="Craft, Guides…" />
              </div>
              <div>
                <Label>Author</Label>
                <Input value={v.author} onChange={(e) => setV({ ...v, author: e.target.value })} />
              </div>
            </div>
          </Card>
          <Card title="Cover image">
            <ImageField value={v.coverImage} onChange={(coverImage) => setV({ ...v, coverImage })} />
          </Card>
        </div>
      </div>
    </form>
  );
}
