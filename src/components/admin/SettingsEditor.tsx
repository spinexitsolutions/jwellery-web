"use client";

import { useState } from "react";
import { changeOwnPassword, exportContent, saveSiteSettings } from "@/app/admin/actions";
import type { Field } from "@/lib/sections";
import type { SiteSettings } from "@/lib/settings-types";
import { SchemaForm } from "./fields";
import { Button, Card, Input, Label, useAction } from "./ui";

const groups: { title: string; description?: string; fields: Field[] }[] = [
  {
    title: "Brand",
    fields: [
      { name: "brandName", label: "Brand name", type: "text" },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "logoUrl", label: "Logo (leave empty to use the brand name as a wordmark)", type: "image" },
      { name: "faviconUrl", label: "Favicon", type: "image" },
    ],
  },
  {
    title: "Contact",
    fields: [
      { name: "email", label: "Email", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "address", label: "Address", type: "textarea" },
      { name: "hours", label: "Opening hours", type: "text" },
      {
        name: "socials",
        label: "Social links",
        type: "list",
        itemLabel: "label",
        fields: [
          { name: "label", label: "Label", type: "text" },
          { name: "href", label: "URL", type: "url" },
        ],
      },
    ],
  },
  {
    title: "Store",
    description: "Prices are shown in this currency across the site and checkout.",
    fields: [
      { name: "currency", label: "Currency code", type: "text", help: "e.g. INR, USD, AED" },
      { name: "locale", label: "Number format locale", type: "text", help: "e.g. en-IN, en-US" },
      { name: "shippingFlat", label: "Flat shipping fee", type: "number", min: 0 },
      { name: "freeShippingAbove", label: "Free shipping above (0 = always use flat fee)", type: "number", min: 0 },
      { name: "codEnabled", label: "Allow pay on delivery", type: "boolean" },
    ],
  },
  {
    title: "Announcement & footer",
    fields: [
      { name: "announcement", label: "Announcement bar text", type: "text", help: "Scrolls in the top bar along with metal rates." },
      { name: "footerNote", label: "Footer note", type: "textarea" },
    ],
  },
  {
    title: "SEO & sharing",
    fields: [
      { name: "seoTitle", label: "Default page title", type: "text" },
      { name: "seoDescription", label: "Default description", type: "textarea" },
      { name: "ogImage", label: "Social share image (1200×630)", type: "image" },
    ],
  },
];

export function SettingsEditor({ initial }: { initial: SiteSettings }) {
  const [v, setV] = useState(initial);
  const { run, pending } = useAction();
  const pw = useAction();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {groups.map((g) => (
          <Card key={g.title} title={g.title} description={g.description}>
            <SchemaForm fields={g.fields} value={v as unknown as Record<string, unknown>} onChange={(x) => setV(x as unknown as SiteSettings)} />
          </Card>
        ))}
        <div className="flex justify-end">
          <Button loading={pending} onClick={() => run(() => saveSiteSettings(v), "Settings saved")}>
            Save settings
          </Button>
        </div>
      </div>
      <div className="space-y-6">
        <Card title="Your password">
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await pw.run(() => changeOwnPassword(cur, next), "Password changed");
              if (r) {
                setCur("");
                setNext("");
              }
            }}
          >
            <div>
              <Label>Current password</Label>
              <Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} required />
            </div>
            <div>
              <Label>New password</Label>
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
            </div>
            <Button variant="secondary" className="w-full" loading={pw.pending}>
              Change password
            </Button>
          </form>
        </Card>
        <Card title="Backup" description="Download all pages, products, collections, journal posts and settings as JSON (secrets excluded).">
          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              const json = await exportContent();
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
              a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
            }}
          >
            Download backup
          </Button>
        </Card>
      </div>
    </div>
  );
}
