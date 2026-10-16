import { ThemeEditor } from "@/components/admin/ThemeEditor";
import { PageTitle } from "@/components/admin/ui";
import { getSetting } from "@/lib/settings";

export default async function ThemePage() {
  const theme = await getSetting("theme");
  return (
    <>
      <PageTitle title="Theme" description="Colours, typography, shape and motion — changes apply to the whole website." />
      <ThemeEditor initial={theme} />
    </>
  );
}
