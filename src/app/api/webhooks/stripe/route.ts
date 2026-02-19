import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { PurchaseConfirmationEmail } from "@/emails/PurchaseConfirmation";

const resend = new Resend(process.env.RESEND_API_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  // CRITICAL: must use text() not json() — Stripe signature verification
  // requires the raw request body as a string
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return Response.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only process paid sessions (some payment methods are async)
    if (session.payment_status === "paid") {
      const { userId, bookId, bookSlug, userEmail } =
        session.metadata ?? {};

      if (!userId || !bookId) {
        return Response.json(
          { error: "Missing metadata: userId or bookId" },
          { status: 400 }
        );
      }

      // Idempotent upsert — safe to receive duplicate webhook events
      const purchase = await prisma.purchase.upsert({
        where: {
          userId_bookId: { userId, bookId },
        },
        create: {
          userId,
          bookId,
          stripePaymentId:
            (session.payment_intent as string) ?? session.id,
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency ?? "usd",
          status: "completed",
        },
        update: {
          status: "completed",
        },
      });

      // Send purchase confirmation email (fire-and-forget)
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        select: { title: true, slug: true },
      });

      const emailRecipient = userEmail ?? session.customer_details?.email;

      if (book && emailRecipient) {
        void resend.emails.send({
          from: "ScienceOne <noreply@scienceone.com>",
          to: emailRecipient,
          subject: `Your ScienceOne purchase: ${book.title}`,
          react: PurchaseConfirmationEmail({
            bookTitle: book.title,
            bookSlug: book.slug ?? bookSlug!,
            amount: (session.amount_total ?? 0) / 100,
            purchaseDate: new Date(purchase.createdAt),
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          }),
        });
      }
    }
  }

  // Always acknowledge the event — Stripe sends many event types
  return Response.json({ received: true });
}
