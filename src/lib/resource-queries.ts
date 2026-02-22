import { cache } from "react";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 12;

interface GetPublishedResourcesParams {
  subject?: string;
  type?: string;
  level?: string;
  sort?: string;
  q?: string;
  page?: number;
}

export async function getPublishedResources({
  subject,
  type,
  level,
  sort,
  q,
  page = 1,
}: GetPublishedResourcesParams = {}) {
  const where: Prisma.ResourceWhereInput = {
    isPublished: true,
  };

  if (subject) {
    where.subjects = {
      some: {
        subject: { slug: subject },
      },
    };
  }

  if (type) {
    where.type = type as Prisma.EnumResourceTypeFilter["equals"];
  }

  if (level) {
    where.level = level as Prisma.EnumResourceLevelFilter["equals"];
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      {
        subjects: {
          some: {
            subject: {
              name: { contains: q, mode: "insensitive" },
            },
          },
        },
      },
    ];
  }

  let orderBy: Prisma.ResourceOrderByWithRelationInput;
  if (sort === "date") {
    orderBy = { createdAt: "desc" };
  } else if (sort === "popular") {
    orderBy = { viewCount: "desc" };
  } else {
    orderBy = { title: "asc" };
  }

  const skip = (page - 1) * PAGE_SIZE;

  const [items, totalCount] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: {
        subjects: { include: { subject: true } },
        pricing: true,
        simulation: { select: { componentKey: true } },
      },
    }),
    prisma.resource.count({ where }),
  ]);

  return { items, totalCount };
}

export const getResourceBySlug = cache(async (slug: string) => {
  const resource = await prisma.resource.findUnique({
    where: { slug, isPublished: true },
    include: {
      subjects: { include: { subject: true } },
      pricing: true,
      simulation: true,
    },
  });
  if (!resource) return null;

  // Increment view count (fire-and-forget)
  void prisma.resource.update({
    where: { id: resource.id },
    data: { viewCount: { increment: 1 } },
  });

  return resource;
});

export async function getSubjects() {
  return prisma.subject.findMany({ orderBy: { name: "asc" } });
}

export const hasResourcePurchase = cache(
  async (userId: string, resourceId: string) => {
    const purchase = await prisma.resourcePurchase.findUnique({
      where: { userId_resourceId: { userId, resourceId } },
      select: { id: true },
    });
    return !!purchase;
  }
);
