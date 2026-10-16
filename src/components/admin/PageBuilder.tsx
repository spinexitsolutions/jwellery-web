"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Eye, EyeOff, GripVertical, Monitor, Plus, RefreshCw, Settings2, Smartphone, Trash2 } from "lucide-react";
import { savePage } from "@/app/admin/actions";
import { makeSection, SECTION_DEFS, SECTION_MAP, type Section } from "@/lib/sections";
import { cn } from "@/lib/utils";
import { SchemaForm } from "./fields";
import { Badge, Button, Input, Label, Modal, Textarea, Toggle, useAction } from "./ui";

type Meta = { id: string; title: string; slug: string; seoTitle: string; seoDescription: string; published: boolean; showInNav: boolean };

export function PageBuilder({ page, initialSections, collections }: { page: Meta; initialSections: Section[]; collections: { name: string; slug: string }[] }) {
  const [meta, setMeta] = useState(page);
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [selected, setSelected] = useState<string | "settings">(initialSections[0]?.id ?? "settings");
  const [dirty, setDirty] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);
  const { run, pending } = useAction();
  const iframe = useRef<HTMLIFrameElement>(null);
  const isHome = page.slug === "home";
  const url = isHome ? "/" : `/${meta.slug}`;

  const update = (fn: (s: Section[]) => Section[]) => {
    setSections(fn);
    setDirty(true);
  };

  const save = useCallback(async () => {
    const r = await run(() => savePage(meta.id, meta, sections), "Page saved");
    if (r) {
      setDirty(false);
      setPreviewKey((k) => k + 1);
    }
  }, [run, meta, sections]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [save, dirty]);

  const current = sections.find((s) => s.id === selected);
  const def = current ? SECTION_MAP[current.type] : null;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length || from === to) return;
    update((s) => {
      const next = [...s];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    });
  };

  const scrollPreviewTo = (id: string) => {
    try {
      const el = iframe.current?.contentDocument?.getElementById(`s-${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
  };

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 lg:-mx-10 lg:-mt-10">
      {/* Top bar */}
      <div className="sticky top-14 z-30 flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:top-0 lg:px-8">
        <Link href="/admin/pages" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Pages
        </Link>
        <span className="text-zinc-300">/</span>
        <h1 className="font-semibold">{meta.title}</h1>
        {meta.published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
        {dirty && <span className="text-xs text-amber-600">● Unsaved changes</span>}
        <div className="ml-auto flex items-center gap-2">
          <a href={url} target="_blank" className="hidden h-10 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm hover:bg-zinc-50 sm:inline-flex">
            <ExternalLink size={14} /> View
          </a>
          <Button onClick={save} loading={pending}>
            Save <kbd className="hidden rounded bg-white/15 px-1.5 text-[10px] sm:inline">⌘S</kbd>
          </Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[300px_420px_1fr]">
        {/* Section list */}
        <div className="border-b border-zinc-200 bg-white p-4 xl:sticky xl:top-[65px] xl:h-[calc(100vh-65px)] xl:overflow-y-auto xl:border-b-0 xl:border-r">
          <button
            onClick={() => setSelected("settings")}
            className={cn("mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm", selected === "settings" ? "bg-zinc-900 text-white" : "hover:bg-zinc-100")}
          >
            <Settings2 size={15} /> Page settings & SEO
          </button>
          <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Sections · drag to reorder</p>
          <ul className="space-y-1">
            {sections.map((s, i) => {
              const d = SECTION_MAP[s.type];
              const label = (s.data.title as string) || (s.data.titleLine1 as string) || (s.data.eyebrow as string) || "";
              return (
                <li
                  key={s.id}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) move(dragIndex, i);
                    setDragIndex(null);
                  }}
                  className={cn(
                    "group flex items-center gap-1 rounded-lg border px-2 py-2 text-sm transition",
                    selected === s.id ? "border-zinc-900 bg-zinc-50" : "border-transparent hover:bg-zinc-50",
                    dragIndex === i && "opacity-40",
                    s.hidden && "opacity-50",
                  )}
                >
                  <GripVertical size={14} className="shrink-0 cursor-grab text-zinc-300" />
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setSelected(s.id);
                      scrollPreviewTo(s.id);
                    }}
                  >
                    <span className="block truncate font-medium">{d?.label ?? s.type}</span>
                    {label && <span className="block truncate text-xs text-zinc-500">{label.replace(/\*/g, "")}</span>}
                  </button>
                  <div className="flex opacity-0 transition group-hover:opacity-100">
                    <IconBtn title="Move up" onClick={() => move(i, i - 1)}>
                      <ArrowUp size={13} />
                    </IconBtn>
                    <IconBtn title="Move down" onClick={() => move(i, i + 1)}>
                      <ArrowDown size={13} />
                    </IconBtn>
                    <IconBtn title={s.hidden ? "Show" : "Hide"} onClick={() => update((all) => all.map((x) => (x.id === s.id ? { ...x, hidden: !x.hidden } : x)))}>
                      {s.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </IconBtn>
                    <IconBtn
                      title="Duplicate"
                      onClick={() =>
                        update((all) => {
                          const copy = { ...JSON.parse(JSON.stringify(s)), id: Math.random().toString(36).slice(2, 10) };
                          return [...all.slice(0, i + 1), copy, ...all.slice(i + 1)];
                        })
                      }
                    >
                      <Copy size={13} />
                    </IconBtn>
                    <IconBtn
                      title="Delete"
                      danger
                      onClick={() => {
                        if (!confirm(`Remove the “${d?.label}” section?`)) return;
                        update((all) => all.filter((x) => x.id !== s.id));
                        if (selected === s.id) setSelected("settings");
                      }}
                    >
                      <Trash2 size={13} />
                    </IconBtn>
                  </div>
                </li>
              );
            })}
          </ul>
          <Button variant="secondary" className="mt-3 w-full" onClick={() => setAdding(sections.length)}>
            <Plus size={14} /> Add section
          </Button>
        </div>

        {/* Editor */}
        <div className="border-b border-zinc-200 bg-white p-5 xl:sticky xl:top-[65px] xl:h-[calc(100vh-65px)] xl:overflow-y-auto xl:border-b-0 xl:border-r">
          {selected === "settings" || !current || !def ? (
            <div className="space-y-5">
              <div>
                <h2 className="font-semibold">Page settings</h2>
                <p className="text-xs text-zinc-500">Title, address and search-engine details.</p>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={meta.title}
                  onChange={(e) => {
                    setMeta({ ...meta, title: e.target.value });
                    setDirty(true);
                  }}
                />
              </div>
              <div>
                <Label help={isHome ? "The home page always lives at /" : "Lowercase letters, numbers and dashes."}>URL slug</Label>
                <div className="flex items-center rounded-lg border border-zinc-200 pl-3 text-sm text-zinc-400 focus-within:border-zinc-400">
                  /
                  <input
                    disabled={isHome}
                    value={isHome ? "" : meta.slug}
                    onChange={(e) => {
                      setMeta({ ...meta, slug: e.target.value });
                      setDirty(true);
                    }}
                    className="h-10 flex-1 bg-transparent px-1 text-zinc-900 outline-none"
                  />
                </div>
              </div>
              <Toggle
                label="Published"
                help="Drafts are only visible to signed-in admins."
                checked={meta.published}
                onChange={(v) => {
                  setMeta({ ...meta, published: v });
                  setDirty(true);
                }}
              />
              <div className="border-t border-zinc-100 pt-5">
                <Label help="Shown in browser tabs and Google results.">SEO title</Label>
                <Input
                  value={meta.seoTitle}
                  placeholder={meta.title}
                  onChange={(e) => {
                    setMeta({ ...meta, seoTitle: e.target.value });
                    setDirty(true);
                  }}
                />
              </div>
              <div>
                <Label>SEO description</Label>
                <Textarea
                  value={meta.seoDescription}
                  rows={3}
                  onChange={(e) => {
                    setMeta({ ...meta, seoDescription: e.target.value });
                    setDirty(true);
                  }}
                />
                <p className="mt-1 text-right text-[11px] text-zinc-400">{meta.seoDescription.length}/160</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-xs text-zinc-500">Google preview</p>
                <p className="mt-1 truncate text-[15px] text-[#1a0dab]">{meta.seoTitle || meta.title}</p>
                <p className="text-xs text-emerald-700">yoursite.com{url}</p>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{meta.seoDescription || "Add a description to control how this page appears in search results."}</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{def.label}</h2>
                  <p className="text-xs text-zinc-500">{def.description}</p>
                </div>
                <button
                  className="text-xs text-zinc-500 hover:text-zinc-900"
                  onClick={() => {
                    if (!confirm("Reset this section to its default content?")) return;
                    update((all) => all.map((x) => (x.id === current.id ? { ...x, data: JSON.parse(JSON.stringify(def.defaults)) } : x)));
                  }}
                >
                  Reset
                </button>
              </div>
              <SchemaForm
                key={current.id}
                fields={def.fields}
                value={current.data}
                collections={collections}
                onChange={(data) => update((all) => all.map((x) => (x.id === current.id ? { ...x, data } : x)))}
              />
              <p className="mt-6 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Tip: wrap words in *asterisks* in headings to give them the italic accent colour.</p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="hidden bg-zinc-100 p-4 xl:block">
          <div className="sticky top-[81px]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5">
                <button onClick={() => setDevice("desktop")} className={cn("rounded-md p-1.5", device === "desktop" && "bg-zinc-900 text-white")} title="Desktop">
                  <Monitor size={14} />
                </button>
                <button onClick={() => setDevice("mobile")} className={cn("rounded-md p-1.5", device === "mobile" && "bg-zinc-900 text-white")} title="Mobile">
                  <Smartphone size={14} />
                </button>
              </div>
              <p className="text-xs text-zinc-500">{dirty ? "Save to update preview" : "Live preview"}</p>
              <button onClick={() => setPreviewKey((k) => k + 1)} className="rounded-md p-1.5 text-zinc-500 hover:bg-white" title="Reload">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className={cn("mx-auto overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all", device === "mobile" ? "w-[390px]" : "w-full")}>
              <iframe ref={iframe} key={previewKey} src={url} className="h-[calc(100vh-150px)] w-full" title="Preview" />
            </div>
          </div>
        </div>
      </div>

      <Modal open={adding !== null} onClose={() => setAdding(null)} title="Add a section" wide>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_DEFS.map((d) => (
            <button
              key={d.type}
              onClick={() => {
                const s = makeSection(d.type);
                update((all) => [...all.slice(0, adding ?? all.length), s, ...all.slice(adding ?? all.length)]);
                setSelected(s.id);
                setAdding(null);
              }}
              className="rounded-xl border border-zinc-200 p-4 text-left transition hover:border-zinc-900 hover:shadow-sm"
            >
              <p className="font-medium">{d.label}</p>
              <p className="mt-1 text-xs text-zinc-500">{d.description}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button type="button" title={title} onClick={onClick} className={cn("rounded p-1 text-zinc-500", danger ? "hover:bg-rose-50 hover:text-rose-600" : "hover:bg-zinc-200 hover:text-zinc-900")}>
      {children}
    </button>
  );
}
