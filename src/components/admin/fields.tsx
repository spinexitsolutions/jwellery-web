"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, ImagePlus, Link2, Plus, Trash2, Upload } from "lucide-react";
import type { Media } from "@prisma/client";
import { listMedia } from "@/app/admin/actions";
import type { Field } from "@/lib/sections";
import { cn } from "@/lib/utils";
import { Button, Input, Label, Modal, Select, Textarea, Toggle, useToast } from "./ui";

/* ---------------- Uploading ---------------- */
export async function uploadFiles(files: FileList | File[]) {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append("file", f));
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.files as Media[];
}

/* ---------------- Media picker ---------------- */
export function MediaPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (url: string) => void }) {
  const [items, setItems] = useState<Media[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) listMedia().then(setItems);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Choose media" wide>
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex flex-1 gap-2">
          <Input placeholder="Paste an image URL (https://…)" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button
            variant="secondary"
            disabled={!url}
            onClick={() => {
              onPick(url);
              setUrl("");
              onClose();
            }}
          >
            <Link2 size={14} /> Use URL
          </Button>
        </div>
        <input
          ref={file}
          type="file"
          accept="image/*,video/mp4,video/webm,application/pdf"
          multiple
          className="hidden"
          onChange={async (e) => {
            if (!e.target.files?.length) return;
            setBusy(true);
            try {
              const up = await uploadFiles(e.target.files);
              setItems((prev) => [...up, ...prev]);
              toast("ok", `${up.length} file(s) uploaded`);
            } catch (err) {
              toast("err", (err as Error).message);
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
        <Button onClick={() => file.current?.click()} loading={busy}>
          <Upload size={14} /> Upload
        </Button>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {items.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              onPick(m.url);
              onClose();
            }}
            className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
          >
            {m.type === "application/pdf" ? (
              <span className="grid h-full w-full place-items-center text-xs font-semibold text-rose-600">PDF</span>
            ) : m.type.startsWith("video") ? (
              <video src={m.url} className="h-full w-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt={m.alt || m.name} className="h-full w-full object-cover transition group-hover:scale-105" />
            )}
            <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1.5 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100">{m.name}</span>
          </button>
        ))}
      </div>
      {items.length === 0 && <p className="py-10 text-center text-sm text-zinc-500">No uploads yet. Upload images or paste a URL above.</p>}
    </Modal>
  );
}

export function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition hover:border-zinc-500"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")} />
        ) : (
          <ImagePlus size={20} />
        )}
      </button>
      <div className="flex-1 space-y-2">
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/… or https://…" />
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
            Choose / upload
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={onChange} />
    </div>
  );
}

export function ImagesField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const move = (i: number, d: number) => {
    const next = [...value];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((src, i) => (
          <div key={src + i} className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 p-1.5 opacity-0 transition group-hover:opacity-100">
              {i > 0 && (
                <button type="button" onClick={() => move(i, -1)} className="rounded bg-white/90 p-1">
                  <ArrowUp size={12} className="-rotate-90" />
                </button>
              )}
              {i < value.length - 1 && (
                <button type="button" onClick={() => move(i, 1)} className="rounded bg-white/90 p-1">
                  <ArrowDown size={12} className="-rotate-90" />
                </button>
              )}
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded bg-white/90 p-1 text-rose-600">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid aspect-square place-items-center rounded-lg border border-dashed border-zinc-300 text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-700"
        >
          <span className="flex flex-col items-center gap-1 text-xs">
            <ImagePlus size={20} /> Add image
          </span>
        </button>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(url) => onChange([...value, url])} />
    </div>
  );
}

export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-10 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-zinc-200" style={{ background: value }}>
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
    </div>
  );
}

/* ---------------- Schema-driven form ---------------- */
type Value = Record<string, unknown>;

export function FieldInput({ field, value, onChange, collections }: { field: Field; value: unknown; onChange: (v: unknown) => void; collections?: { name: string; slug: string }[] }) {
  switch (field.type) {
    case "text":
    case "url":
      return <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={"placeholder" in field ? field.placeholder : undefined} />;
    case "textarea":
      return <Textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} />;
    case "markdown":
      return <Textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} rows={8} className="font-mono text-[13px]" placeholder="Supports **bold**, *italic*, ## headings, - lists, [links](url)" />;
    case "html":
      return <Textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} rows={8} className="font-mono text-[12px]" />;
    case "number":
      return <Input type="number" value={(value as number) ?? ""} min={field.min} max={field.max} step={field.step} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
    case "boolean":
      return <Toggle checked={!!value} onChange={onChange} />;
    case "select":
      return (
        <Select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    case "collection":
      return (
        <Select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Select collection —</option>
          {(collections ?? []).map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      );
    case "image":
      return <ImageField value={(value as string) ?? ""} onChange={onChange} />;
    case "color":
      return <ColorField value={(value as string) ?? "#000000"} onChange={onChange} />;
    case "list":
      return <ListField field={field} value={(value as Value[]) ?? []} onChange={onChange} collections={collections} />;
  }
}

function ListField({ field, value, onChange, collections }: { field: Extract<Field, { type: "list" }>; value: Value[]; onChange: (v: Value[]) => void; collections?: { name: string; slug: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const blank = () => Object.fromEntries(field.fields.map((f) => [f.name, f.type === "boolean" ? false : ""]));
  const move = (i: number, d: number) => {
    const next = [...value];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((item, i) => {
        const title = (field.itemLabel && (item[field.itemLabel] as string)) || `Item ${i + 1}`;
        return (
          <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50/60">
            <div className="flex items-center gap-2 px-3 py-2">
              <button type="button" className="flex-1 truncate text-left text-[13px] font-medium text-zinc-800" onClick={() => setOpen(open === i ? null : i)}>
                <span className="mr-2 text-zinc-400">{open === i ? "▾" : "▸"}</span>
                {title}
              </button>
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30">
                <ArrowUp size={13} />
              </button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30">
                <ArrowDown size={13} />
              </button>
              <button type="button" onClick={() => onChange([...value.slice(0, i + 1), JSON.parse(JSON.stringify(item)), ...value.slice(i + 1)])} className="rounded p-1 text-zinc-500 hover:bg-zinc-200">
                <Copy size={13} />
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded p-1 text-rose-500 hover:bg-rose-50">
                <Trash2 size={13} />
              </button>
            </div>
            {open === i && (
              <div className="space-y-4 border-t border-zinc-200 bg-white p-3">
                <SchemaForm fields={field.fields} value={item} onChange={(v) => onChange(value.map((x, k) => (k === i ? v : x)))} collections={collections} />
              </div>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => {
          onChange([...value, blank()]);
          setOpen(value.length);
        }}
      >
        <Plus size={13} /> Add {field.itemLabel ? "item" : "row"}
      </Button>
    </div>
  );
}

export function SchemaForm({ fields, value, onChange, collections, className }: { fields: Field[]; value: Value; onChange: (v: Value) => void; collections?: { name: string; slug: string }[]; className?: string }) {
  return (
    <div className={cn("space-y-5", className)}>
      {fields.map((f) =>
        f.type === "boolean" ? (
          <Toggle key={f.name} label={f.label} help={f.help} checked={!!value[f.name]} onChange={(v) => onChange({ ...value, [f.name]: v })} />
        ) : (
          <div key={f.name}>
            <Label help={f.help}>{f.label}</Label>
            <FieldInput field={f} value={value[f.name]} onChange={(v) => onChange({ ...value, [f.name]: v })} collections={collections} />
          </div>
        ),
      )}
    </div>
  );
}
