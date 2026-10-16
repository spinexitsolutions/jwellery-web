import type { Metadata } from "next";
import { WishlistView } from "@/components/site/WishlistView";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return <WishlistView />;
}
