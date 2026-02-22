"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function createResourceCheckoutSession(resourceId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch resource + pricing — NEVER trust client-sent prices
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId, isPublished: true },
    include: { pricing: true },
  });

  if (!resource) {
    throw new Error("Resource not found");
  }

  if (!resource.pricing || !resource.pricing.isActive) {
    throw new Error("No active pricing found for this resource");
  }

  // Check if already purchased — redirect to resource page
  const existing = await prisma.resourcePurchase.findUnique({
    where: {
      userId_resourceId: { userId: session.user.id, resourceId },
    },
  });

  if (existing) {
    redirect(`/resources/${resource.slug}`);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(resource.pricing.amount) * 100),
          product_data: {
            name: resource.title,
            description: `${resource.type.replace(/_/g, " ")} resource`,
          },
        },
      },
    ],
    metadata: {
      productType: "resource",
      userId: session.user.id,
      resourceId: resource.id,
      resourceSlug: resource.slug,
      userEmail: session.user.email,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase/resource-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/resources/${resource.slug}`,
  });

  redirect(checkoutSession.url!);
}
