import prisma from "@/lib/prisma";

export async function getAllResourcesAdmin() {
  const resources = await prisma.resource.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      subjects: { include: { subject: true } },
      pricing: true,
      simulation: { select: { componentKey: true } },
    },
  });
  return resources.map((resource) => ({
    ...resource,
    pricing: resource.pricing
      ? { ...resource.pricing, amount: Number(resource.pricing.amount) }
      : null,
  }));
}

export type ResourceAdminRow = Awaited<ReturnType<typeof getAllResourcesAdmin>>[number];

export async function getResourceAdmin(resourceId: string) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: {
      subjects: { include: { subject: true } },
      pricing: true,
      simulation: true,
    },
  });
  if (!resource) return null;
  return {
    ...resource,
    pricing: resource.pricing
      ? { ...resource.pricing, amount: Number(resource.pricing.amount) }
      : null,
  };
}

export type ResourceAdminDetail = NonNullable<Awaited<ReturnType<typeof getResourceAdmin>>>;

export async function getAllSubjects() {
  return prisma.subject.findMany({ orderBy: { name: "asc" } });
}
