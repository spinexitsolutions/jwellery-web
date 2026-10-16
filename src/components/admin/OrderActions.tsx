"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteOrder, updateOrder } from "@/app/admin/actions";
import { Button, Card, Label, Select, useAction } from "./ui";

export function OrderActions({ id, status, paymentStatus }: { id: string; status: string; paymentStatus: string }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [s, setS] = useState(status);
  const [p, setP] = useState(paymentStatus);
  return (
    <Card title="Fulfilment">
      <div className="space-y-4">
        <div>
          <Label>Order status</Label>
          <Select value={s} onChange={(e) => setS(e.target.value)}>
            {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((x) => (
              <option key={x} value={x}>
                {x[0].toUpperCase() + x.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Payment status</Label>
          <Select value={p} onChange={(e) => setP(e.target.value)}>
            {["unpaid", "paid", "failed", "refunded"].map((x) => (
              <option key={x} value={x}>
                {x[0].toUpperCase() + x.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            loading={pending}
            onClick={async () => {
              await run(() => updateOrder(id, { status: s, paymentStatus: p }), "Order updated");
              router.refresh();
            }}
          >
            Update
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!confirm("Delete this order permanently?")) return;
              const r = await run(() => deleteOrder(id), "Order deleted");
              if (r) router.push("/admin/orders");
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
