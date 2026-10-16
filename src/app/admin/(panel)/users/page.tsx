import { UsersManager } from "@/components/admin/UsersManager";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function UsersPage() {
  const session = await requireAdmin({ role: "admin" });
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  return (
    <>
      <PageTitle title="Users" description="Admins can do everything. Editors manage content, catalogue and orders — but not integrations, API keys or users." />
      <UsersManager me={session.sub} users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))} />
    </>
  );
}
