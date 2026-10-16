"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Home, Store, Trash2, Video } from "lucide-react";
import { deleteAppointment, updateAppointment } from "@/app/admin/actions-commerce";
import { cn } from "@/lib/utils";
import { Badge, Button, EmptyState, Input, Label, Modal, Select, Toggle, useAction } from "./ui";

type A = { id: string; type: string; name: string; email: string; phone: string; date: string; slot: string; store: string | null; address: string | null; pincode: string | null; products: string | null; notes: string | null; status: string; meetingLink: string | null };
const ICON = { store: Store, home: Home, video: Video } as const;
const LABEL = { store: "Boutique", home: "Try at home", video: "Video" } as const;

export function AppointmentsManager({ rows }: { rows: A[] }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [filter, setFilter] = useState("upcoming");
  const [edit, setEdit] = useState<(A & { notify: boolean }) | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const list = useMemo(
    () => rows.filter((r) => (filter === "upcoming" ? r.date >= today && r.status !== "cancelled" : filter === "past" ? r.date < today : filter === "requested" ? r.status === "requested" : true)),
    [rows, filter, today],
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {["upcoming", "requested", "past", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("rounded-full px-3 py-1.5 text-xs capitalize", filter === s ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white hover:bg-zinc-50")}>
            {s}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title="No appointments here" description="Requests from the Book page appear here." />
      ) : (
        <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
          {list.map((a) => {
            const Icon = ICON[a.type as keyof typeof ICON] ?? Store;
            return (
              <button key={a.id} onClick={() => setEdit({ ...a, notify: true })} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-zinc-50">
                <div className="w-20 shrink-0 text-center">
                  <p className="text-xs text-zinc-500">{new Date(`${a.date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", month: "short" })}</p>
                  <p className="text-xl font-semibold">{a.date.slice(8)}</p>
                  <p className="text-xs tabular-nums">{a.slot}</p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100">
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.name}</p>
                  <p className="truncate text-sm text-zinc-500">
                    {LABEL[a.type as keyof typeof LABEL]}
                    {a.store && ` · ${a.store}`}
                    {a.pincode && ` · ${a.pincode}`}
                    {a.products && ` · ${a.products}`}
                  </p>
                </div>
                <Badge tone={a.status === "confirmed" ? "green" : a.status === "cancelled" ? "red" : a.status === "completed" ? "zinc" : "amber"}>{a.status}</Badge>
              </button>
            );
          })}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? `${LABEL[edit.type as keyof typeof LABEL]} · ${edit.name}` : ""}>
        {edit && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await run(() => updateAppointment(edit.id, { status: edit.status, meetingLink: edit.meetingLink ?? "", notify: edit.notify }), "Appointment updated");
              if (r) {
                setEdit(null);
                router.refresh();
              }
            }}
          >
            <div className="space-y-1 rounded-xl bg-zinc-50 p-4 text-sm">
              <p>
                {new Date(`${edit.date}T00:00:00`).toLocaleDateString("en-IN", { dateStyle: "full" })} at <b>{edit.slot}</b>
              </p>
              <p>
                {edit.phone} · {edit.email}
              </p>
              {edit.store && <p>Boutique: {edit.store}</p>}
              {edit.address && (
                <p>
                  Address: {edit.address} {edit.pincode}
                </p>
              )}
              {edit.products && <p>Pieces: {edit.products}</p>}
              {edit.notes && <p className="text-zinc-600">“{edit.notes}”</p>}
            </div>
            <div>
              <Label>Status</Label>
              <Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                {["requested", "confirmed", "completed", "cancelled"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
            {edit.type === "video" && (
              <div>
                <Label help="Google Meet / Zoom / WhatsApp video link — sent to the customer when confirmed.">Meeting link</Label>
                <Input value={edit.meetingLink ?? ""} onChange={(e) => setEdit({ ...edit, meetingLink: e.target.value })} placeholder="https://meet.google.com/…" />
              </div>
            )}
            <Toggle label="Notify the customer (email / SMS)" checked={edit.notify} onChange={(notify) => setEdit({ ...edit, notify })} />
            <div className="flex gap-2">
              <Button className="flex-1" loading={pending}>
                Save
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  if (!confirm("Delete this appointment?")) return;
                  await run(() => deleteAppointment(edit.id), "Deleted");
                  setEdit(null);
                  router.refresh();
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
