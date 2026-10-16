import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrder } from "@/components/site/TrackOrder";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <Suspense>
      <TrackOrder />
    </Suspense>
  );
}
