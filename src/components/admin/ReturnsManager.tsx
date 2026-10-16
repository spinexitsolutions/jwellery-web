"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateReturn } from "@/app/admin/actions-commerce";
import { formatPrice } from "@/lib/utils";
import { Badge, Button, EmptyState, Label, Modal, Select, Textarea, Toggle, useAction } from "./ui";

type Row = { id: string; type: string; status: string; reason: string; details: string | null; adminNote: string; items: string[]; createdAt: string; order: { id: string; number: string; customerName: string; email: string; phone: string; total: number; paymentMethod: string } };
const STATUSES = ["requested", "approved", "rejected", "picked_up", "refunded", "exchanged", "closed"];
const tone = (s: string) => (s === "requested" ? "amber" : s === "rejected" ? "red" : s === "refunded" || s === "exchanged" || s === "closed" ? "green" : "blue") as "amber";

export function ReturnsManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [edit, setEdit] = useState<(Row & { notify: boolean }) | null>(null);
  if (rows.length === 0) return <EmptyState title="No return requests" description="Customers can request returns from delivered orders within your return window." />;
  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="hidden px-5 py-3 font-medium md:table-cell">Reason</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.id} onClick={() => setEdit({ ...r, notify: true })} className="cursor-pointer hover:bg-zinc-50">
                <td className="px-5 py-3 font-mono text-xs">{r.order.number}</td>
                <td className="px-5 py-3">
                  <p className="font-medium">{r.order.customerName}</p>
                  <p className="text-xs text-zinc-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                </td>
                <td className="px-5 py-3 capitalize">{r.type}</td>
                <td className="hidden px-5 py-3 text-zinc-600 md:table-cell">{r.reason}</td>
                <td className="px-5 py-3">
                  <Badge tone={tone(r.status)}>{r.status.replace(/_/g, " ")}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? `${edit.type === "return" ? "Return" : "Exchange"} · ${edit.order.number}` : ""}>
        {edit && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await run(() => updateReturn(edit.id, edit.status, edit.adminNote, edit.notify), "Updated");
              if (r) {
                setEdit(null);
                router.refresh();
              }
            }}
          >
            <div className="rounded-xl bg-zinc-50 p-4 text-sm">
              <p>
                <b>{edit.order.customerName}</b> · {edit.order.phone} · {edit.order.email}
              </p>
              <p className="mt-2">Items: {edit.items.join(", ")}</p>
              <p>Reason: {edit.reason}</p>
              {edit.details && <p className="mt-1 text-zinc-600">“{edit.details}”</p>}
              <p className="mt-2 text-zinc-500">
                Order total {formatPrice(edit.order.total)} · {edit.order.paymentMethod === "cod" ? "COD" : "Paid online"} ·{" "}
                <Link href={`/admin/orders/${edit.order.id}`} className="underline">
                  open order
                </Link>
              </p>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label help="Shown to the customer on their order page and in the notification.">Message to customer</Label>
              <Textarea rows={3} value={edit.adminNote} onChange={(e) => setEdit({ ...edit, adminNote: e.target.value })} placeholder="e.g. Pickup scheduled for Thursday between 11–2." />
            </div>
            <Toggle label="Notify the customer (email / SMS)" checked={edit.notify} onChange={(notify) => setEdit({ ...edit, notify })} />
            <Button className="w-full" loading={pending}>
              Save
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
