"use client";

import { useRef, useState } from "react";
import { Copy, Trash2, Upload } from "lucide-react";
import { deleteMedia, updateMediaAlt } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { uploadFiles } from "./fields";
import { Button, EmptyState, Input, Label, useToast } from "./ui";

type M = { id: string; url: string; name: string; type: string; size: number; alt: string | null; createdAt: string };

export function MediaLibrary({ initial }: { initial: M[] }) {
  const [items, setItems] = useState(initial);
  const [sel, setSel] = useState<M | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | File[]) => {
    setBusy(true);
    try {
      const up = await uploadFiles(files);
      setItems((p) => [...(up as unknown as M[]).map((m) => ({ ...m, createdAt: String(m.createdAt) })), ...p]);
      toast("ok", `${up.length} file(s) uploaded`);
    } catch (e) {
      toast("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
      }}
    >
      <div className={cn("mb-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition", drag ? "border-zinc-900 bg-zinc-100" : "border-zinc-200 bg-white")}>
        <Upload className="text-zinc-400" />
        <p className="mt-3 font-medium">Drop files here to upload</p>
        <p className="text-sm text-zinc-500">JPG, PNG, WEBP, AVIF, SVG, MP4, PDF · up to 15MB each</p>
        <input ref={input} type="file" multiple accept="image/*,video/mp4,video/webm,application/pdf" className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
        <Button className="mt-4" loading={busy} onClick={() => input.current?.click()}>
          Choose files
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No media yet" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {items.map((m) => (
              <button key={m.id} onClick={() => setSel(m)} className={cn("group aspect-square overflow-hidden rounded-xl border-2 bg-zinc-100", sel?.id === m.id ? "border-zinc-900" : "border-transparent")}>
                {m.type === "application/pdf" ? (
                  <span className="grid h-full w-full place-items-center text-xs font-semibold text-rose-600">PDF</span>
                ) : m.type.startsWith("video") ? (
                  <video src={m.url} className="h-full w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt ?? ""} className="h-full w-full object-cover transition group-hover:scale-105" />
                )}
              </button>
            ))}
          </div>
          {sel && (
            <div className="h-fit space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 lg:sticky lg:top-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {sel.type.startsWith("image") && <img src={sel.url} alt="" className="w-full rounded-lg" />}
              <div className="text-sm">
                <p className="truncate font-medium">{sel.name}</p>
                <p className="text-xs text-zinc-500">
                  {(sel.size / 1024).toFixed(0)} KB · {sel.type}
                </p>
              </div>
              <div>
                <Label>URL</Label>
                <div className="flex gap-2">
                  <Input readOnly value={sel.url} />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(sel.url);
                      toast("ok", "Copied");
                    }}
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
              <div>
                <Label help="Describes the image for screen readers and SEO.">Alt text</Label>
                <Input
                  defaultValue={sel.alt ?? ""}
                  key={sel.id}
                  onBlur={async (e) => {
                    await updateMediaAlt(sel.id, e.target.value);
                    setItems((p) => p.map((x) => (x.id === sel.id ? { ...x, alt: e.target.value } : x)));
                  }}
                />
              </div>
              <Button
                variant="danger"
                className="w-full"
                onClick={async () => {
                  if (!confirm("Delete this file? Pages using it will show a placeholder.")) return;
                  await deleteMedia(sel.id);
                  setItems((p) => p.filter((x) => x.id !== sel.id));
                  setSel(null);
                  toast("ok", "Deleted");
                }}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
