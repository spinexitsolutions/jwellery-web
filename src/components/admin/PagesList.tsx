"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, ExternalLink, Home, Plus, Trash2 } from "lucide-react";
import { createPage, deletePage, duplicatePage } from "@/app/admin/actions";
import { Badge, Button, Input, Label, Modal, Select, useAction } from "./ui";

type Row = { id: string; title: string; slug: string; published: boolean; sections: number; updatedAt: string };

export function PagesList({ pages }: { pages: Row[] }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<"content" | "blank">("content");

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus size={15} /> New page
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/60 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-medium">Page</th>
              <th className="hidden px-5 py-3 font-medium md:table-cell">Sections</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="hidden px-5 py-3 font-medium md:table-cell">Updated</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pages.map((p) => (
              <tr key={p.id} className="group hover:bg-zinc-50/60">
                <td className="px-5 py-3">
                  <Link href={`/admin/pages/${p.id}`} className="flex items-center gap-2 font-medium hover:underline">
                    {p.slug === "home" && <Home size={14} className="text-amber-600" />}
                    {p.title}
                  </Link>
                  <p className="text-xs text-zinc-500">/{p.slug === "home" ? "" : p.slug}</p>
                </td>
                <td className="hidden px-5 py-3 text-zinc-600 md:table-cell">{p.sections}</td>
                <td className="px-5 py-3">{p.published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}</td>
                <td className="hidden px-5 py-3 text-zinc-500 md:table-cell">{new Date(p.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <a href={p.slug === "home" ? "/" : `/${p.slug}`} target="_blank" className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800" title="View">
                      <ExternalLink size={15} />
                    </a>
                    <button
                      className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"
                      title="Duplicate"
                      onClick={async () => {
                        const r = await run(() => duplicatePage(p.id), "Page duplicated");
                        if (r && "data" in r && r.data) router.push(`/admin/pages/${r.data.id}`);
                      }}
                    >
                      <Copy size={15} />
                    </button>
                    {p.slug !== "home" && (
                      <button
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete"
                        onClick={async () => {
                          if (!confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
                          await run(() => deletePage(p.id), "Page deleted");
                          router.refresh();
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New page">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await run(() => createPage(title, template), "Page created");
            if (r && "data" in r && r.data) router.push(`/admin/pages/${r.data.id}`);
          }}
        >
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus placeholder="e.g. Bridal consultations" />
          </div>
          <div>
            <Label>Start from</Label>
            <Select value={template} onChange={(e) => setTemplate(e.target.value as "content" | "blank")}>
              <option value="content">Header + text</option>
              <option value="blank">Blank page</option>
            </Select>
          </div>
          <Button className="w-full" loading={pending}>
            Create page
          </Button>
        </form>
      </Modal>
    </>
  );
}
