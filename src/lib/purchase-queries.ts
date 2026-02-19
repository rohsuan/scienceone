import { cache } from "react";
import prisma from "@/lib/prisma";

/**
 * Check if a user has purchased a book by its slug.
 * Used on the detail page where we have slug (not bookId).
 */
export const hasPurchasedBySlug = cache(
  async (userId: string, bookSlug: string): Promise<boolean> => {
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId,
        book: { slug: bookSlug },
        status: "completed",
      },
      select: { id: true },
    });
    return purchase !== null;
  }
);

/**
 * Get all completed purchases for a user with book details.
 * Used by My Library (Plan 02).
 */
export const getUserPurchases = cache(async (userId: string) => {
  return prisma.purchase.findMany({
    where: { userId, status: "completed" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      currency: true,
      createdAt: true,
      book: {
        select: {
          id: true,
          title: true,
          slug: true,
          authorName: true,
          coverImage: true,
        },
      },
    },
  });
});
