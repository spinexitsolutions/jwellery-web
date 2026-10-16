"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { deleteCoupon, saveCoupon } from "@/app/admin/actions-commerce";
import { Badge, Button, EmptyState, Input, Label, Modal, Select, Textarea, Toggle, useAction } from "./ui";

type C = { id: string; code: string; description: string | null; type: string; value: number; minOrder: number; maxDiscount: number | null; usageLimit: number | null; usedCount: number; startsAt: string; endsAt: string; active: boolean };
const blank: C = { id: "", code: "", description: "", type: "percent", value: 10, minOrder: 0, maxDiscount: null, usageLimit: null, usedCount: 0, startsAt: "", endsAt: "", active: true };

export function CouponsManager({ coupons }: { coupons: C[] }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [edit, setEdit] = useState<C | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const status = (c: C) =>
    !c.active ? ["Paused", "zinc"] : c.endsAt && c.endsAt < today ? ["Expired", "red"] : c.startsAt && c.startsAt > today ? ["Scheduled", "blue"] : c.usageLimit && c.usedCount >= c.usageLimit ? ["Used up", "amber"] : ["Active", "green"];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEdit({ ...blank })}>
          <Plus size={15} /> New coupon
        </Button>
      </div>
      {coupons.length === 0 ? (
        <EmptyState title="No coupons yet" description="Create codes like WELCOME10 or DIWALI5000." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Discount</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Min order</th>
                <th className="px-5 py-3 font-medium">Used</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Valid</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {coupons.map((c) => {
                const [label, tone] = status(c);
                return (
                  <tr key={c.id} onClick={() => setEdit(c)} className="cursor-pointer hover:bg-zinc-50">
                    <td className="px-5 py-3">
                      <span className="font-mono font-semibold">{c.code}</span>
                      {c.description && <p className="text-xs text-zinc-500">{c.description}</p>}
                    </td>
                    <td className="px-5 py-3">
                      {c.type === "percent" ? `${c.value}%` : `₹${c.value.toLocaleString("en-IN")}`}
                      {c.maxDiscount ? <span className="text-xs text-zinc-500"> (max ₹{c.maxDiscount.toLocaleString("en-IN")})</span> : null}
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">{c.minOrder ? `₹${c.minOrder.toLocaleString("en-IN")}` : "—"}</td>
                    <td className="px-5 py-3 tabular-nums">
                      {c.usedCount}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                    </td>
                    <td className="hidden px-5 py-3 text-xs text-zinc-500 md:table-cell">{c.startsAt || c.endsAt ? `${c.startsAt || "now"} → ${c.endsAt || "∞"}` : "Always"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={tone as "green"}>{label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? `Edit ${edit.code}` : "New coupon"}>
        {edit && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await run(() => saveCoupon(edit.id || null, { ...edit, type: edit.type as "percent" | "flat" }), "Coupon saved");
              if (r) {
                setEdit(null);
                router.refresh();
              }
            }}
          >
            <div>
              <Label>Code</Label>
              <Input required value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase().replace(/\s/g, "") })} className="font-mono uppercase" placeholder="WELCOME10" />
            </div>
            <div>
              <Label help="Shown to the customer when applied.">Description</Label>
              <Textarea rows={2} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })}>
                  <option value="percent">Percentage</option>
                  <option value="flat">Flat ₹</option>
                </Select>
              </div>
              <div>
                <Label>{edit.type === "percent" ? "Percent off" : "Amount off (₹)"}</Label>
                <Input type="number" required min={1} value={edit.value} onChange={(e) => setEdit({ ...edit, value: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Minimum order (₹)</Label>
                <Input type="number" min={0} value={edit.minOrder} onChange={(e) => setEdit({ ...edit, minOrder: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Max discount (₹)</Label>
                <Input type="number" min={0} value={edit.maxDiscount ?? ""} placeholder="No cap" onChange={(e) => setEdit({ ...edit, maxDiscount: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <Label>Starts</Label>
                <Input type="date" value={edit.startsAt} onChange={(e) => setEdit({ ...edit, startsAt: e.target.value })} />
              </div>
              <div>
                <Label>Ends</Label>
                <Input type="date" value={edit.endsAt} onChange={(e) => setEdit({ ...edit, endsAt: e.target.value })} />
              </div>
              <div>
                <Label>Total uses allowed</Label>
                <Input type="number" min={1} value={edit.usageLimit ?? ""} placeholder="Unlimited" onChange={(e) => setEdit({ ...edit, usageLimit: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="pt-6">
                <Toggle label="Active" checked={edit.active} onChange={(active) => setEdit({ ...edit, active })} />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              {edit.id ? (
                <Button
                  type="button"
                  variant="danger"
                  onClick={async () => {
                    if (!confirm("Delete this coupon?")) return;
                    await run(() => deleteCoupon(edit.id), "Deleted");
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
