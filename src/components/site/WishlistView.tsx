"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductView } from "@/lib/types";
import { useAccount } from "./Account";
import { SplitText } from "./motion";
import { ProductCard } from "./ProductCard";

export function WishlistView() {
  const { wishlist, ready, customer } = useAccount();
  const [products, setProducts] = useState<ProductView[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!wishlist.length) return setProducts([]);
    fetch(`/api/products?ids=${wishlist.join(",")}`)
      .then((r) => r.json())
      .then((j) => setProducts(j.data));
    // Only refetch when the set of ids changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, wishlist.join(",")]);

  return (
    <div className="site-container pb-28 pt-36 md:pt-44">
      <p className="eyebrow">Saved for later</p>
      <SplitText as="h1" immediate text="Your *wishlist*" className="display mt-5 block text-[clamp(3.2rem,9vw,8rem)] leading-[0.9]" />
      {!customer && ready && wishlist.length > 0 && (
        <p className="mt-6 text-sm text-muted">
          <Link href="/account?next=/wishlist" className="underline">
            Sign in
          </Link>{" "}
          to keep your wishlist across devices.
        </p>
      )}
      <div className="mt-14">
        {products === null ? (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-[var(--radius)] bg-surface" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="display text-5xl">Nothing saved yet</p>
            <p className="mt-3 text-muted">Tap the heart on any piece to keep it here.</p>
            <Link href="/shop" className="btn btn-primary mt-8">
              Discover pieces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
            {products
              .filter((p) => wishlist.includes(p.id))
              .map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
