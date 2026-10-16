"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Check, ExternalLink, Star, Trash2, X } from "lucide-react";
import { deleteReview, moderateReview } from "@/app/admin/actions-commerce";
import { cn } from "@/lib/utils";
import { Badge, Button, EmptyState, useAction } from "./ui";

type R = { id: string; product: string; slug: string; name: string; email: string | null; rating: number; title: string | null; body: string; verified: boolean; status: string; createdAt: string };

export function ReviewsModeration({ reviews }: { reviews: R[] }) {
  const router = useRouter();
  const { run } = useAction();
  const [tab, setTab] = useState("pending");
  const list = reviews.filter((r) => tab === "all" || r.status === tab);
  const count = (s: string) => reviews.filter((r) => r.status === s).length;
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    await run(fn as () => Promise<{ ok: true }>, msg);
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button key={s} onClick={() => setTab(s)} className={cn("rounded-full px-3 py-1.5 text-xs capitalize", tab === s ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white hover:bg-zinc-50")}>
            {s} {s !== "all" && <span className="opacity-60">({count(s)})</span>}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title={tab === "pending" ? "All caught up" : "No reviews"} description="New reviews from the product pages show up here." />
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={14} className={n <= r.rating ? "fill-current" : "text-zinc-300"} />
                      ))}
                    </span>
                    <Badge tone={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "amber"}>{r.status}</Badge>
                    {r.verified && (
                      <span className="flex items-center gap-1 text-xs text-emerald-700">
                        <BadgeCheck size={13} /> Verified buyer
                      </span>
                    )}
                  </div>
                  <a href={`/shop/${r.slug}#reviews`} target="_blank" className="mt-1 flex items-center gap-1 text-xs text-zinc-500 hover:underline">
                    {r.product} <ExternalLink size={11} />
                  </a>
                </div>
                <div className="flex gap-2">
                  {r.status !== "approved" && (
                    <Button size="sm" onClick={() => act(() => moderateReview(r.id, "approved"), "Approved")}>
                      <Check size={13} /> Approve
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button size="sm" variant="secondary" onClick={() => act(() => moderateReview(r.id, "rejected"), "Rejected")}>
                      <X size={13} /> Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Delete this review?")) act(() => deleteReview(r.id), "Deleted");
                    }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
              {r.title && <p className="mt-3 font-medium">{r.title}</p>}
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{r.body}</p>
              <p className="mt-3 text-xs text-zinc-500">
                {r.name} {r.email && `· ${r.email}`} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
