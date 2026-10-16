import { getIntegrationsForAdmin } from "@/app/admin/actions";
import { IntegrationsEditor } from "@/components/admin/IntegrationsEditor";
import { PageTitle } from "@/components/admin/ui";

export default async function IntegrationsPage() {
  const integrations = await getIntegrationsForAdmin();
  return (
    <>
      <PageTitle title="Integrations" description="Connect payments, analytics, email, WhatsApp, live metal rates, webhooks and custom code." />
      <IntegrationsEditor initial={integrations} />
    </>
  );
}
