"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Mail, Phone, Trash2 } from "lucide-react";
import { deleteInquiry, deleteSubscriber, updateInquiry } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { Badge, Button, EmptyState, Select, useAction } from "./ui";

type Inq = { id: string; type: string; name: string; email: string; phone: string | null; subject: string | null; message: string; status: string; createdAt: string };

function csv(rows: Record<string, unknown>[], name: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const body = [keys.join(","), ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  a.download = name;
  a.click();
}

export function InquiriesView({ inquiries, subscribers, initialTab }: { inquiries: Inq[]; subscribers: { id: string; email: string; createdAt: string }[]; initialTab: "inquiries" | "subscribers" }) {
  const router = useRouter();
  const { run } = useAction();
  const [tab, setTab] = useState(initialTab);
  const [open, setOpen] = useState<string | null>(inquiries[0]?.id ?? null);
  const [filter, setFilter] = useState("");
  const list = inquiries.filter((i) => !filter || i.status === filter);
  const current = inquiries.find((i) => i.id === open);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5 text-sm">
          {(["inquiries", "subscribers"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("rounded-md px-4 py-1.5 capitalize", tab === t && "bg-zinc-900 text-white")}>
              {t} <span className="opacity-60">({t === "inquiries" ? inquiries.length : subscribers.length})</span>
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={() => (tab === "inquiries" ? csv(inquiries, "inquiries.csv") : csv(subscribers, "subscribers.csv"))}>
          <Download size={13} /> Export CSV
        </Button>
      </div>

      {tab === "subscribers" ? (
        subscribers.length === 0 ? (
          <EmptyState title="No subscribers yet" description="Newsletter sign-ups from the website appear here." />
        ) : (
          <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
            {subscribers.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>{s.email}</span>
                <span className="flex items-center gap-3 text-xs text-zinc-500">
                  {new Date(s.createdAt).toLocaleDateString("en-IN")}
                  <button
                    onClick={async () => {
                      await run(() => deleteSubscriber(s.id), "Removed");
                      router.refresh();
                    }}
                    className="rounded p-1 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )
      ) : inquiries.length === 0 ? (
        <EmptyState title="Inbox zero" description="Messages from the contact form will appear here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 p-2">
              <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">All</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <ul className="max-h-[70vh] divide-y divide-zinc-100 overflow-y-auto">
              {list.map((i) => (
                <li key={i.id}>
                  <button
                    onClick={async () => {
                      setOpen(i.id);
                      if (i.status === "new") {
                        await updateInquiry(i.id, "read");
                        router.refresh();
                      }
                    }}
                    className={cn("w-full px-4 py-3 text-left", open === i.id ? "bg-zinc-50" : "hover:bg-zinc-50/60")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm", i.status === "new" && "font-semibold")}>{i.name}</p>
                      <span className="shrink-0 text-[11px] text-zinc-400">{new Date(i.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">{i.message}</p>
                    <div className="mt-1.5 flex gap-1">
                      <Badge tone={i.type === "appointment" ? "violet" : "zinc"}>{i.type}</Badge>
                      {i.status === "new" && <Badge tone="amber">new</Badge>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {current && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{current.name}</h2>
                  <p className="text-sm text-zinc-500">{new Date(current.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={current.status}
                    onChange={async (e) => {
                      await run(() => updateInquiry(current.id, e.target.value), "Status updated");
                      router.refresh();
                    }}
                    className="w-36"
                  >
                    {["new", "read", "replied", "archived"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      if (!confirm("Delete this inquiry?")) return;
                      await run(() => deleteInquiry(current.id), "Deleted");
                      router.refresh();
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <a href={`mailto:${current.email}?subject=Re: ${encodeURIComponent(current.subject || "Your enquiry")}`} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50">
                  <Mail size={14} /> {current.email}
                </a>
                {current.phone && (
                  <a href={`tel:${current.phone}`} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50">
                    <Phone size={14} /> {current.phone}
                  </a>
                )}
              </div>
              {current.subject && (
                <p className="mt-6 text-sm">
                  <span className="text-zinc-500">{current.type === "appointment" ? "Preferred time: " : "Subject: "}</span>
                  {current.type === "appointment" && !isNaN(Date.parse(current.subject)) ? new Date(current.subject).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" }) : current.subject}
                </p>
              )}
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm leading-relaxed">{current.message}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
