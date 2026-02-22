"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createResourceCheckoutSession } from "@/lib/resource-checkout-actions";

interface ResourceBuyButtonProps {
  resourceId: string;
  price: number;
}

export default function ResourceBuyButton({ resourceId, price }: ResourceBuyButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className="w-full"
      disabled={isPending}
      onClick={() => startTransition(() => createResourceCheckoutSession(resourceId))}
    >
      {isPending ? "Redirecting to checkout..." : `Buy — $${price.toFixed(2)}`}
    </Button>
  );
}
