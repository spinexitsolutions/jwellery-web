import { CommerceEditor } from "@/components/admin/CommerceEditor";
import { PageTitle } from "@/components/admin/ui";
import { getSetting } from "@/lib/settings";

export default async function CommercePage() {
  const commerce = await getSetting("commerce");
  return (
    <>
      <PageTitle title="Store settings" description="GST & invoices, EMI, gift wrap, delivery, returns, appointments and reviews." />
      <CommerceEditor initial={commerce} />
    </>
  );
}
