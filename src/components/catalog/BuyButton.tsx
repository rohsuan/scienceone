"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/checkout-actions";

interface BuyButtonProps {
  bookId: string;
  price: number;
}

export default function BuyButton({ bookId, price }: BuyButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className="w-full"
      disabled={isPending}
      onClick={() => startTransition(() => createCheckoutSession(bookId))}
    >
      {isPending ? "Redirecting to checkout..." : `Buy — $${price.toFixed(2)}`}
    </Button>
  );
}
