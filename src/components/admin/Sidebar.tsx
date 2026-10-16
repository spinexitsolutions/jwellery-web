"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgePercent,
  CalendarClock,
  MapPinned,
  MessageSquareQuote,
  RotateCcw,
  Store,
  UserRound,
  BookOpen,
  Boxes,
  ExternalLink,
  FileText,
  Gem,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Navigation,
  Palette,
  Plug,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups = [
  { label: "", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Content",
    items: [
      { href: "/admin/pages", label: "Pages", icon: FileText },
      { href: "/admin/journal", label: "Journal", icon: BookOpen },
      { href: "/admin/media", label: "Media library", icon: ImageIcon },
      { href: "/admin/navigation", label: "Navigation", icon: Navigation },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Gem },
      { href: "/admin/collections", label: "Collections", icon: Boxes },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote, count: "reviews" as const },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, count: "orders" as const },
      { href: "/admin/returns", label: "Returns", icon: RotateCcw, count: "returns" as const },
      { href: "/admin/customers", label: "Customers", icon: UserRound },
      { href: "/admin/coupons", label: "Coupons", icon: BadgePercent },
    ],
  },
  {
    label: "Clienteling",
    items: [
      { href: "/admin/appointments", label: "Appointments", icon: CalendarClock, count: "appointments" as const },
      { href: "/admin/inquiries", label: "Inquiries", icon: Inbox, count: "inquiries" as const },
      { href: "/admin/stores", label: "Boutiques", icon: MapPinned },
    ],
  },
  {
    label: "Configure",
    items: [
      { href: "/admin/theme", label: "Theme", icon: Palette },
      { href: "/admin/settings", label: "Site settings", icon: Settings },
      { href: "/admin/commerce", label: "Store settings", icon: Store },
      { href: "/admin/integrations", label: "Integrations", icon: Plug, adminOnly: true },
      { href: "/admin/api-keys", label: "API keys", icon: KeyRound, adminOnly: true },
      { href: "/admin/users", label: "Users", icon: Users, adminOnly: true },
    ],
  },
];

export function Sidebar({ brand, user, counts }: { brand: string; user: { name: string; email: string; role: string }; counts: { orders: number; inquiries: number; reviews: number; returns: number; appointments: number } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-900 text-white">
            <Gem size={15} />
          </span>
          <span className="font-semibold">{brand}</span>
        </Link>
        <a href="/" target="_blank" className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" title="View website">
          <ExternalLink size={15} />
        </a>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.label}>
            {g.label && <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400">{g.label}</p>}
            <ul className="space-y-0.5">
              {g.items
                .filter((i) => !("adminOnly" in i && i.adminOnly) || user.role === "admin")
                .map((item) => {
                  const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                  const n = "count" in item && item.count ? counts[item.count] : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition",
                          active ? "bg-zinc-900 font-medium text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                        )}
                      >
                        <item.icon size={16} strokeWidth={1.8} />
                        <span className="flex-1">{item.label}</span>
                        {n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] font-medium", active ? "bg-white/20" : "bg-amber-100 text-amber-800")}>{n}</span>}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-zinc-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-amber-500 text-xs font-semibold text-amber-950">{user.name.slice(0, 1).toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{user.name}</p>
            <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" title="Sign out">
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-zinc-200 bg-white lg:block">{nav}</aside>
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-zinc-100" aria-label="Open menu">
          <Menu size={18} />
        </button>
        <span className="font-semibold">{brand}</span>
        <a href="/" target="_blank" className="rounded-md p-2 hover:bg-zinc-100">
          <ExternalLink size={16} />
        </a>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-zinc-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-md p-1.5 hover:bg-zinc-100" aria-label="Close menu">
              <X size={16} />
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
