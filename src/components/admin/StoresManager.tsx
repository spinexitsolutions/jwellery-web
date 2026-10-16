"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { deleteStore, saveStore } from "@/app/admin/actions-commerce";
import { ImageField } from "./fields";
import { Badge, Button, EmptyState, Input, Label, Modal, Textarea, Toggle, useAction } from "./ui";

type S = { id: string; name: string; city: string; address: string; phone: string | null; email: string | null; hours: string | null; image: string | null; lat: number | null; lng: number | null; mapUrl: string | null; services: string; sortOrder: number; active: boolean };
const blank: S = { id: "", name: "", city: "", address: "", phone: "", email: "", hours: "Mon – Sat · 11:00 – 20:00", image: "", lat: null, lng: null, mapUrl: "", services: "store,tryathome,video", sortOrder: 0, active: true };

export function StoresManager({ stores }: { stores: S[] }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [edit, setEdit] = useState<S | null>(null);
  const has = (s: S, k: string) => s.services.split(",").includes(k);
  const toggleService = (s: S, k: string, on: boolean) => ({ ...s, services: Array.from(new Set([...s.services.split(",").filter((x) => x && x !== k), ...(on ? [k] : [])])).join(",") });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEdit({ ...blank, sortOrder: stores.length + 1 })}>
          <Plus size={15} /> Add boutique
        </Button>
      </div>
      {stores.length === 0 ? (
        <EmptyState title="No boutiques yet" description="Add your stores so customers can find you and book visits." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <button key={s.id} onClick={() => setEdit(s)} className="rounded-2xl border border-zinc-200 bg-white p-5 text-left transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-500">{s.city}</p>
                  <p className="font-semibold">{s.name}</p>
                </div>
                {!s.active && <Badge>Hidden</Badge>}
              </div>
              <p className="mt-2 flex gap-1.5 text-sm text-zinc-500">
                <MapPin size={14} className="mt-0.5 shrink-0" /> {s.address}
              </p>
              <div className="mt-3 flex gap-1">
                {has(s, "tryathome") && <Badge tone="violet">Try at home</Badge>}
                {has(s, "video") && <Badge tone="blue">Video</Badge>}
              </div>
            </button>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? `Edit ${edit.name}` : "New boutique"}>
        {edit && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await run(() => saveStore(edit.id || null, edit), "Boutique saved");
              if (r) {
                setEdit(null);
                router.refresh();
              }
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div>
                <Label>City</Label>
                <Input required value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea rows={2} required value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input value={edit.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={edit.email ?? ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Hours</Label>
              <Input value={edit.hours ?? ""} onChange={(e) => setEdit({ ...edit, hours: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label help="Right-click the spot in Google Maps to copy">Latitude</Label>
                <Input type="number" step="any" value={edit.lat ?? ""} onChange={(e) => setEdit({ ...edit, lat: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Input type="number" step="any" placeholder="Longitude" value={edit.lng ?? ""} onChange={(e) => setEdit({ ...edit, lng: e.target.value ? Number(e.target.value) : null })} />
              </div>
            </div>
            <div>
              <Label help="Optional Google Maps share link for the Directions button">Maps link</Label>
              <Input value={edit.mapUrl ?? ""} onChange={(e) => setEdit({ ...edit, mapUrl: e.target.value })} />
            </div>
            <div>
              <Label>Photo</Label>
              <ImageField value={edit.image ?? ""} onChange={(image) => setEdit({ ...edit, image })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Toggle label="Try at home" checked={has(edit, "tryathome")} onChange={(on) => setEdit(toggleService(edit, "tryathome", on))} />
              <Toggle label="Video calls" checked={has(edit, "video")} onChange={(on) => setEdit(toggleService(edit, "video", on))} />
              <Toggle label="Visible" checked={edit.active} onChange={(active) => setEdit({ ...edit, active })} />
              <div>
                <Label>Order</Label>
                <Input type="number" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              {edit.id ? (
                <Button
                  type="button"
                  variant="danger"
                  onClick={async () => {
                    if (!confirm("Delete this boutique?")) return;
                    await run(() => deleteStore(edit.id), "Deleted");
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
