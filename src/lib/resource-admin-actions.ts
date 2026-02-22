"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { resourceUpdateSchema, type ResourceUpdateData } from "@/lib/resource-admin-schemas";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}

export async function createResource(data: {
  title: string;
  slug: string;
  type: "LESSON_PLAN" | "PROBLEM_SET" | "COURSE_MODULE" | "LAB_GUIDE" | "SIMULATION";
  level: "AP" | "INTRO_UNIVERSITY" | "ADVANCED_UNIVERSITY";
}) {
  await requireAdmin();

  const resource = await prisma.resource.create({
    data: {
      title: data.title,
      slug: data.slug,
      type: data.type,
      level: data.level,
      isPublished: false,
    },
  });

  revalidatePath("/admin/resources");
  return resource.id;
}

export async function updateResource(resourceId: string, data: ResourceUpdateData) {
  await requireAdmin();

  const validated = resourceUpdateSchema.parse(data);

  await prisma.resource.update({
    where: { id: resourceId },
    data: {
      title: validated.title,
      slug: validated.slug,
      description: validated.description ?? null,
      content: validated.content ?? null,
      type: validated.type,
      level: validated.level,
      isFree: validated.isFree,
      coverImage: validated.coverImage ?? null,
      fileKey: validated.fileKey ?? null,
      fileName: validated.fileName ?? null,
    },
  });

  // Upsert pricing
  if (!validated.isFree && validated.price != null) {
    await prisma.resourcePrice.upsert({
      where: { resourceId },
      create: {
        resourceId,
        amount: validated.price,
        currency: "USD",
      },
      update: {
        amount: validated.price,
      },
    });
  } else if (validated.isFree) {
    await prisma.resourcePrice.deleteMany({ where: { resourceId } });
  }

  // Sync subjects: delete all then recreate
  await prisma.resourceSubject.deleteMany({ where: { resourceId } });
  if (validated.subjectIds.length > 0) {
    await prisma.resourceSubject.createMany({
      data: validated.subjectIds.map((subjectId) => ({ resourceId, subjectId })),
    });
  }

  // Upsert simulation record if type is SIMULATION
  if (validated.type === "SIMULATION" && validated.componentKey) {
    await prisma.simulation.upsert({
      where: { resourceId },
      create: {
        resourceId,
        componentKey: validated.componentKey,
        teacherGuide: validated.teacherGuide ?? null,
        parameterDocs: validated.parameterDocs ?? null,
      },
      update: {
        componentKey: validated.componentKey,
        teacherGuide: validated.teacherGuide ?? null,
        parameterDocs: validated.parameterDocs ?? null,
      },
    });
  } else if (validated.type !== "SIMULATION") {
    // Clean up simulation record if type changed away from SIMULATION
    await prisma.simulation.deleteMany({ where: { resourceId } });
  }

  revalidatePath("/admin/resources");
  revalidatePath(`/admin/resources/${resourceId}`);
  revalidatePath("/resources");

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { slug: true },
  });
  if (resource) {
    revalidatePath(`/resources/${resource.slug}`);
    revalidatePath(`/simulations/${resource.slug}`);
  }
}

export async function deleteResource(resourceId: string) {
  await requireAdmin();

  await prisma.resource.delete({
    where: { id: resourceId },
  });

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  revalidatePath("/simulations");
}

export async function togglePublishResource(resourceId: string, publish: boolean) {
  await requireAdmin();

  await prisma.resource.update({
    where: { id: resourceId },
    data: { isPublished: publish },
  });

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  revalidatePath("/simulations");
}

