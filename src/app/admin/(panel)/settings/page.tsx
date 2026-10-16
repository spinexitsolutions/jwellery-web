import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { PageTitle } from "@/components/admin/ui";
import { getSetting } from "@/lib/settings";

export default async function SettingsPage() {
  const site = await getSetting("site");
  return (
    <>
      <PageTitle title="Site settings" description="Brand, contact details, store rules and SEO." />
      <SettingsEditor initial={site} />
    </>
  );
}
