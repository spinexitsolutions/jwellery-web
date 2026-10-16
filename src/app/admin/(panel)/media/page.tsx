import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function MediaPage() {
  const media = await db.media.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageTitle title="Media library" description="Upload images and videos once, use them anywhere on the site." />
      <MediaLibrary initial={media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
    </>
  );
}
