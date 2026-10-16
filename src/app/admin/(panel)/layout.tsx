import { Sidebar } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const [site, newOrders, newInquiries, reviews, returns, appointments] = await Promise.all([
    getSetting("site"),
    db.order.count({ where: { status: { in: ["pending", "placed"] } } }),
    db.inquiry.count({ where: { status: "new" } }),
    db.review.count({ where: { status: "pending" } }),
    db.returnRequest.count({ where: { status: "requested" } }),
    db.appointment.count({ where: { status: "requested" } }),
  ]);
  return (
    <ToastProvider>
      <div className="lg:pl-64">
        <Sidebar brand={site.brandName} user={{ name: session.name, email: session.email, role: session.role }} counts={{ orders: newOrders, inquiries: newInquiries, reviews, returns, appointments }} />
        <main className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-10 lg:pt-10">{children}</main>
      </div>
    </ToastProvider>
  );
}
