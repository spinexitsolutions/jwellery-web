import type { Metadata } from "next";
import { Checkout } from "@/components/site/Checkout";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return <Checkout />;
}
