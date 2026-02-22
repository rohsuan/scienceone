import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { stripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Purchase Complete | ScienceOne",
};

interface ResourcePurchaseSuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function ResourcePurchaseSuccessPage({
  searchParams,
}: ResourcePurchaseSuccessPageProps) {
  const { session_id } = await searchParams;

  if (!session_id) {
    notFound();
  }

  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["line_items"],
  });

  if (session.payment_status !== "paid") {
    notFound();
  }

  const resourceSlug = session.metadata?.resourceSlug;
  const resourceTitle = session.line_items?.data[0]?.description;
  const customerEmail = session.customer_details?.email ?? session.customer_email;

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
      </div>

      <h1 className="font-serif text-3xl font-bold mb-4">Purchase Complete</h1>

      <p className="text-muted-foreground mb-2">You now have full access to:</p>

      {resourceTitle && (
        <p className="font-serif text-xl font-semibold mb-6">{resourceTitle}</p>
      )}

      {customerEmail && (
        <p className="text-sm text-muted-foreground mb-8">
          A receipt has been sent to {customerEmail}
        </p>
      )}

      {resourceSlug && (
        <Button asChild size="lg">
          <Link href={`/resources/${resourceSlug}`}>View Resource</Link>
        </Button>
      )}
    </div>
  );
}
