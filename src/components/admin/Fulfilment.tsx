"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Truck } from "lucide-react";
import { deleteOrder } from "@/app/admin/actions";
import { createShiprocketShipment, updateFulfilment } from "@/app/admin/actions-commerce";
import { Button, Card, Input, Label, Select, Textarea, Toggle, useAction } from "./ui";

const STATUSES = [
  ["placed", "Placed"],
  ["confirmed", "Confirmed"],
  ["shipped", "Shipped"],
  ["out_for_delivery", "Out for delivery"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
];

export function Fulfilment(props: { id: string; status: string; paymentStatus: string; courier: string; awb: string; trackingUrl: string; shipmentId: string | null; shiprocket: boolean; items: { name: string; huid: string }[] }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const sr = useAction();
  const [v, setV] = useState({ status: props.status, paymentStatus: props.paymentStatus, courier: props.courier, awb: props.awb, trackingUrl: props.trackingUrl, note: "", notify: true });
  const [huids, setHuids] = useState<Record<number, string>>(Object.fromEntries(props.items.map((i, k) => [k, i.huid])));
  return (
    <Card title="Fulfilment">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await run(() => updateFulfilment(props.id, { ...v, huids }), v.notify && v.status !== props.status ? "Updated & customer notified" : "Order updated");
          if (r) {
            setV({ ...v, note: "" });
            router.refresh();
          }
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Status</Label>
            <Select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })}>
              {STATUSES.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Payment</Label>
            <Select value={v.paymentStatus} onChange={(e) => setV({ ...v, paymentStatus: e.target.value })}>
              {["unpaid", "paid", "failed", "refunded"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Courier</Label>
            <Input value={v.courier} onChange={(e) => setV({ ...v, courier: e.target.value })} placeholder="BlueDart" />
          </div>
          <div>
            <Label>AWB</Label>
            <Input value={v.awb} onChange={(e) => setV({ ...v, awb: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Tracking URL</Label>
          <Input value={v.trackingUrl} onChange={(e) => setV({ ...v, trackingUrl: e.target.value })} placeholder="https://…" />
        </div>
        {props.shiprocket && !props.shipmentId && (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            loading={sr.pending}
            onClick={async () => {
              const r = await sr.run(() => createShiprocketShipment(props.id), "Shipment created on Shiprocket");
              if (r) router.refresh();
            }}
          >
            <Truck size={14} /> Create Shiprocket shipment
          </Button>
        )}
        {props.shipmentId && <p className="text-xs text-zinc-500">Shiprocket shipment #{props.shipmentId}</p>}
        <div>
          <Label help="Printed on the GST invoice and shown to the customer.">HUID per piece</Label>
          <div className="space-y-2">
            {props.items.map((i, k) => (
              <div key={k} className="flex items-center gap-2">
                <span className="flex-1 truncate text-xs text-zinc-600">{i.name}</span>
                <div className="w-28 shrink-0">
                  <Input value={huids[k] ?? ""} maxLength={6} onChange={(e) => setHuids({ ...huids, [k]: e.target.value.toUpperCase() })} className="h-8 font-mono text-xs uppercase" placeholder="HUID" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label help="Added to the customer's order timeline.">Timeline note (optional)</Label>
          <Textarea rows={2} value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} placeholder="e.g. Hand-delivered by our Jaipur concierge" />
        </div>
        <Toggle label="Notify customer on status change" help="Email + SMS (if configured)" checked={v.notify} onChange={(notify) => setV({ ...v, notify })} />
        <div className="flex gap-2">
          <Button className="flex-1" loading={pending}>
            Update order
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              if (!confirm("Delete this order permanently?")) return;
              const r = await run(() => deleteOrder(props.id), "Order deleted");
              if (r) router.push("/admin/orders");
            }}
          >
            Delete
          </Button>
        </div>
      </form>
    </Card>
  );
}
