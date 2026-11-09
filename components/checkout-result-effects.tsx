"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store/cart-store";

export function CheckoutResultEffects({ paid }: { paid: boolean }) {
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    if (paid) clear();
  }, [paid, clear]);

  return null;
}
