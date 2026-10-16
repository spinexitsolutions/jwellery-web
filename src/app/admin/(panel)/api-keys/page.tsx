import { ApiKeysManager } from "@/components/admin/ApiKeysManager";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ApiKeysPage() {
  await requireAdmin({ role: "admin" });
  const keys = await db.apiKey.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageTitle title="API keys" description="Use your catalogue and content from a mobile app, another website or automation tools via the REST API." />
      <ApiKeysManager keys={keys.map((k) => ({ id: k.id, name: k.name, prefix: k.prefix, scopes: k.scopes, lastUsedAt: k.lastUsedAt?.toISOString() ?? null, createdAt: k.createdAt.toISOString() }))} />
    </>
  );
}
