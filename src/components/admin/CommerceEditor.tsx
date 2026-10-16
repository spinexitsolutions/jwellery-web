"use client";

import { useState } from "react";
import { saveCommerce } from "@/app/admin/actions-commerce";
import type { CommerceSettings } from "@/lib/settings-types";
import { Button, Card, Input, Label, Select, Textarea, Toggle, useAction } from "./ui";

const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function CommerceEditor({ initial }: { initial: CommerceSettings }) {
  const [v, setV] = useState(initial);
  const [slots, setSlots] = useState(initial.appointmentSlots.join(", "));
  const [sizes, setSizes] = useState(initial.ringSizes.join(", "));
  const [months, setMonths] = useState(initial.emiMonths.join(", "));
  const { run, pending } = useAction();
  const set = <K extends keyof CommerceSettings>(k: K, x: CommerceSettings[K]) => setV((p) => ({ ...p, [k]: x }));
  const num = (k: keyof CommerceSettings, label: string, help?: string) => (
    <div>
      <Label help={help}>{label}</Label>
      <Input type="number" step="any" value={v[k] as number} onChange={(e) => set(k, Number(e.target.value) as never)} />
    </div>
  );
  const txt = (k: keyof CommerceSettings, label: string, help?: string, placeholder?: string) => (
    <div>
      <Label help={help}>{label}</Label>
      <Input value={v[k] as string} placeholder={placeholder} onChange={(e) => set(k, e.target.value as never)} />
    </div>
  );

  return (
    <div className="space-y-6">
      <Card title="GST & invoices" description="Printed on every PDF tax invoice. CGST+SGST is used when the customer is in your state, otherwise IGST.">
        <div className="grid gap-5 sm:grid-cols-2">
          {txt("legalName", "Registered business name")}
          {txt("gstin", "GSTIN", undefined, "08ABCDE1234F1Z5")}
          {txt("businessState", "Business state", "Must match the state names used at checkout, e.g. Rajasthan.")}
          {num("gstPercent", "GST % on jewellery", "3% for gold, silver and diamond jewellery.")}
          {txt("invoicePrefix", "Invoice number prefix", "Invoices are numbered PREFIX + year + sequence.")}
          {txt("hsnCode", "Default HSN code", "7113 — articles of jewellery.")}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="EMI">
          <div className="space-y-4">
            <Toggle label="Show EMI on product pages" help="Payment itself happens through Razorpay's card/cardless EMI." checked={v.emiEnabled} onChange={(x) => set("emiEnabled", x)} />
            <div className="grid gap-4 sm:grid-cols-3">
              {num("emiMinAmount", "Minimum price")}
              <div>
                <Label>Tenures (months)</Label>
                <Input value={months} onChange={(e) => setMonths(e.target.value)} placeholder="3, 6, 9, 12" />
              </div>
              {num("emiInterestPercent", "Interest % p.a.", "0 = no-cost EMI")}
            </div>
          </div>
        </Card>
        <Card title="Gift wrap">
          <div className="space-y-4">
            <Toggle label="Offer gift wrap at checkout" checked={v.giftWrapEnabled} onChange={(x) => set("giftWrapEnabled", x)} />
            {num("giftWrapFee", "Gift wrap fee (0 = complimentary)")}
          </div>
        </Card>
      </div>

      <Card title="Delivery" description="Used for the PIN-code checker on product pages and at checkout.">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Mode</Label>
              <Select value={v.deliveryMode} onChange={(e) => set("deliveryMode", e.target.value as CommerceSettings["deliveryMode"])}>
                <option value="rules">My rules (below)</option>
                <option value="shiprocket">Shiprocket live serviceability (falls back to rules)</option>
              </Select>
            </div>
            {num("deliveryCodMax", "Max order value for COD (0 = no limit)")}
          </div>
          <Toggle label="Deliver to all PIN codes" checked={v.deliveryAllPincodes} onChange={(x) => set("deliveryAllPincodes", x)} />
          {!v.deliveryAllPincodes && txt("deliveryPincodePrefixes", "Serviceable PIN prefixes", "Comma separated, e.g. 30, 11, 400")}
          <div className="grid gap-5 sm:grid-cols-3">
            {txt("deliveryExpressPrefixes", "Express PIN prefixes", "Metro areas with faster delivery")}
            {num("deliveryExpressDays", "Express days")}
            {num("deliveryStandardDays", "Standard days")}
          </div>
        </div>
      </Card>

      <Card title="Returns & exchange">
        <div className="space-y-4">
          <div className="grid gap-5 sm:grid-cols-2">
            {num("returnWindowDays", "Return window (days after delivery)")}
            <div className="pt-6">
              <Toggle label="Allow exchange requests" checked={v.exchangeEnabled} onChange={(x) => set("exchangeEnabled", x)} />
            </div>
          </div>
          <div>
            <Label>Policy summary</Label>
            <Textarea rows={3} value={v.returnPolicy} onChange={(e) => set("returnPolicy", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card title="Appointments" description="Boutique visits, try-at-home and video consultations.">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label help="Comma separated, 24-hour time">Time slots</Label>
              <Input value={slots} onChange={(e) => setSlots(e.target.value)} />
            </div>
            {num("appointmentDaysAhead", "Bookable days ahead")}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Toggle label="Try at home" checked={v.tryAtHomeEnabled} onChange={(x) => set("tryAtHomeEnabled", x)} />
            <Toggle label="Video consultations" checked={v.videoConsultEnabled} onChange={(x) => set("videoConsultEnabled", x)} />
          </div>
          {v.tryAtHomeEnabled && txt("tryAtHomePincodes", "Try-at-home PIN prefixes", "Leave empty to allow everywhere.")}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Reviews">
          <Toggle label="Publish reviews without moderation" help="Otherwise new reviews wait in Admin → Reviews." checked={v.reviewsAutoApprove} onChange={(x) => set("reviewsAutoApprove", x)} />
        </Card>
        <Card title="Ring sizes">
          <Label help="Default Indian sizes offered by the “Ring sizes” button on products.">Sizes</Label>
          <Input value={sizes} onChange={(e) => setSizes(e.target.value)} />
        </Card>
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          className="shadow-lg"
          loading={pending}
          onClick={() =>
            run(
              () =>
                saveCommerce({
                  ...v,
                  appointmentSlots: list(slots),
                  ringSizes: list(sizes),
                  emiMonths: list(months)
                    .map(Number)
                    .filter((n) => n > 0),
                }),
              "Store settings saved",
            )
          }
        >
          Save store settings
        </Button>
      </div>
    </div>
  );
}
