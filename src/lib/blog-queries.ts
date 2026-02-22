import { cache } from "react";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 12;

interface GetPublishedBlogPostsParams {
  category?: string;
  subject?: string;
  sort?: string;
  q?: string;
  page?: number;
}

export async function getPublishedBlogPosts({
  category,
  subject,
  sort,
  q,
  page = 1,
}: GetPublishedBlogPostsParams = {}) {
  const where: Prisma.BlogPostWhereInput = {
    isPublished: true,
  };

  if (category) {
    where.category = category as Prisma.EnumBlogCategoryFilter["equals"];
  }

  if (subject) {
    where.subjects = {
      some: {
        subject: { slug: subject },
      },
    };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
      { authorName: { contains: q, mode: "insensitive" } },
    ];
  }

  let orderBy: Prisma.BlogPostOrderByWithRelationInput;
  if (sort === "oldest") {
    orderBy = { publishedAt: "asc" };
  } else {
    orderBy = { publishedAt: "desc" };
  }

  const skip = (page - 1) * PAGE_SIZE;

  const [items, totalCount] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: {
        subjects: { include: { subject: true } },
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { items, totalCount };
}

export const getBlogPostBySlug = cache(async (slug: string) => {
  return prisma.blogPost.findUnique({
    where: { slug, isPublished: true },
    include: {
      subjects: { include: { subject: true } },
    },
  });
});

export async function getRecentBlogPosts(limit = 3) {
  return prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      authorName: true,
      coverImage: true,
      publishedAt: true,
    },
  });
}

export async function getRelatedResources(
  subjectIds: string[],
  excludeId?: string,
  limit = 4
) {
  if (subjectIds.length === 0) return [];

  const where: Prisma.ResourceWhereInput = {
    isPublished: true,
    type: { not: "SIMULATION" },
    subjects: { some: { subjectId: { in: subjectIds } } },
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  return prisma.resource.findMany({
    where,
    take: limit,
    orderBy: { viewCount: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      description: true,
      coverImage: true,
      isFree: true,
    },
  });
}
