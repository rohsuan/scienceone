"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function createCheckoutSession(bookId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch book + pricing — NEVER trust client-sent prices
  const book = await prisma.book.findUnique({
    where: { id: bookId, isPublished: true },
    include: { pricing: true },
  });

  if (!book) {
    throw new Error("Book not found");
  }

  if (!book.pricing || !book.pricing.isActive) {
    throw new Error("No active pricing found for this book");
  }

  // Check if already purchased — redirect to reader
  const existing = await prisma.purchase.findUnique({
    where: {
      userId_bookId: { userId: session.user.id, bookId },
    },
  });

  if (existing) {
    redirect(`/read/${book.slug}`);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(book.pricing.amount) * 100),
          product_data: {
            name: book.title,
            description: `by ${book.authorName}`,
          },
        },
      },
    ],
    metadata: {
      productType: "book",
      userId: session.user.id,
      bookId: book.id,
      bookSlug: book.slug,
      userEmail: session.user.email,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/catalog/${book.slug}`,
  });

  redirect(checkoutSession.url!);
}
