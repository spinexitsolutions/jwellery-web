"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, KeyRound, Trash2 } from "lucide-react";
import { createApiKey, deleteApiKey } from "@/app/admin/actions";
import { Badge, Button, Card, Input, Label, Toggle, useAction, useToast } from "./ui";

type K = { id: string; name: string; prefix: string; scopes: string; lastUsedAt: string | null; createdAt: string };

const ENDPOINTS = [
  ["GET", "/api/v1/products", "List products (?collection=slug&limit=&offset=)"],
  ["GET", "/api/v1/products/:idOrSlug", "One product"],
  ["POST", "/api/v1/products", "Create a product (write)"],
  ["PATCH", "/api/v1/products/:idOrSlug", "Update a product (write)"],
  ["GET", "/api/v1/collections[/:slug]", "Collections, with products"],
  ["GET", "/api/v1/posts[/:slug]", "Journal posts"],
  ["GET", "/api/v1/pages[/:slug]", "CMS pages with sections"],
  ["GET", "/api/v1/settings", "Brand, theme & navigation"],
  ["GET", "/api/v1/orders[/:number]", "Orders (write)"],
  ["PATCH", "/api/v1/orders/:number", "Update order status (write)"],
  ["POST", "/api/v1/inquiries", "Create an inquiry (write)"],
];

export function ApiKeysManager({ keys }: { keys: K[] }) {
  const router = useRouter();
  const toast = useToast();
  const { run, pending } = useAction();
  const [name, setName] = useState("");
  const [write, setWrite] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        {created && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-medium text-emerald-900">Your new key — copy it now, it won't be shown again.</p>
            <div className="mt-3 flex gap-2">
              <Input readOnly value={created} className="font-mono" />
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(created);
                  toast("ok", "Copied");
                }}
              >
                <Copy size={14} />
              </Button>
            </div>
          </div>
        )}
        <Card title="Keys">
          {keys.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No API keys yet.</p>
          ) : (
            <ul className="-my-2 divide-y divide-zinc-100">
              {keys.map((k) => (
                <li key={k.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-100">
                    <KeyRound size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{k.name}</p>
                    <p className="font-mono text-xs text-zinc-500">
                      {k.prefix}… · {k.lastUsedAt ? `last used ${new Date(k.lastUsedAt).toLocaleDateString("en-IN")}` : "never used"}
                    </p>
                  </div>
                  {k.scopes.split(",").map((s) => (
                    <Badge key={s} tone={s === "write" ? "amber" : "blue"}>
                      {s}
                    </Badge>
                  ))}
                  <button
                    className="rounded-md p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                    onClick={async () => {
                      if (!confirm(`Revoke “${k.name}”? Apps using it will stop working.`)) return;
                      await run(() => deleteApiKey(k.id), "Key revoked");
                      router.refresh();
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Endpoints" description="Send the key in an x-api-key header (or Authorization: Bearer).">
          <div className="space-y-1.5">
            {ENDPOINTS.map(([m, p, d]) => (
              <div key={m + p} className="flex flex-wrap items-center gap-3 text-sm">
                <span className={`w-14 rounded px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold ${m === "GET" ? "bg-sky-50 text-sky-700" : m === "POST" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{m}</span>
                <code className="font-mono text-[13px]">{p}</code>
                <span className="text-xs text-zinc-500">{d}</span>
              </div>
            ))}
          </div>
          <pre className="mt-5 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100">{`curl ${origin || "https://yoursite.com"}/api/v1/products \\
  -H "x-api-key: kya_xxxxxxxx"`}</pre>
        </Card>
      </div>
      <Card title="Create a key">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await run(() => createApiKey(name, write ? ["read", "write"] : ["read"]), "Key created");
            if (r && "data" in r && r.data) {
              setCreated(r.data.key);
              setName("");
              router.refresh();
            }
          }}
        >
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mobile app" required />
          </div>
          <Toggle label="Write access" help="Allow creating/updating products, orders and inquiries." checked={write} onChange={setWrite} />
          <Button className="w-full" loading={pending}>
            Generate key
          </Button>
        </form>
      </Card>
    </div>
  );
}
