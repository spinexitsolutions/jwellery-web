"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { deleteCollection, saveCollection } from "@/app/admin/actions";
import { ImageField } from "./fields";
import { Button, EmptyState, Input, Label, Modal, Textarea, Toggle, useAction } from "./ui";

type C = { id: string; name: string; slug: string; tagline: string; description: string; image: string; featured: boolean; sortOrder: number; count: number };
const blank: C = { id: "", name: "", slug: "", tagline: "", description: "", image: "", featured: true, sortOrder: 0, count: 0 };

export function CollectionsManager({ collections }: { collections: C[] }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [edit, setEdit] = useState<C | null>(null);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEdit({ ...blank, sortOrder: collections.length + 1 })}>
          <Plus size={15} /> New collection
        </Button>
      </div>
      {collections.length === 0 ? (
        <EmptyState title="No collections yet" description="Create collections like Bridal, Everyday or Solitaires." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <button key={c.id} onClick={() => setEdit(c)} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left transition hover:shadow-md">
              <div className="relative aspect-[16/10] bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.image && <img src={c.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}
                {c.featured && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium">
                    <Star size={11} className="fill-amber-400 text-amber-400" /> Featured
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-zinc-500">{c.count} products</p>
                </div>
                <p className="mt-0.5 text-sm text-zinc-500">{c.tagline || `/${c.slug}`}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? `Edit ${edit.name}` : "New collection"}>
        {edit && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await run(() => saveCollection(edit.id || null, edit), "Collection saved");
              if (r) {
                setEdit(null);
                router.refresh();
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={edit.slug} placeholder="auto" onChange={(e) => setEdit({ ...edit, slug: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={edit.tagline} onChange={(e) => setEdit({ ...edit, tagline: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            </div>
            <div>
              <Label>Cover image</Label>
              <ImageField value={edit.image} onChange={(image) => setEdit({ ...edit, image })} />
            </div>
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <Toggle label="Featured" help="Show on the home page" checked={edit.featured} onChange={(featured) => setEdit({ ...edit, featured })} />
              <div>
                <Label>Sort order</Label>
                <Input type="number" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex justify-between gap-2 pt-2">
              {edit.id ? (
                <Button
                  type="button"
                  variant="danger"
                  onClick={async () => {
                    if (!confirm("Delete this collection? Its products will be kept but unassigned.")) return;
                    await run(() => deleteCollection(edit.id), "Deleted");
                    setEdit(null);
                    router.refresh();
                  }}
                >
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <Button loading={pending}>Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
