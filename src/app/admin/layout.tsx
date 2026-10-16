import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-zinc-50 font-[ui-sans-serif,system-ui,-apple-system,'Segoe_UI',Roboto,sans-serif] text-zinc-900 antialiased">{children}</div>;
}
