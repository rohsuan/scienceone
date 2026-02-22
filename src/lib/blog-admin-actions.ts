"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { blogPostUpdateSchema, type BlogPostUpdateData } from "@/lib/blog-admin-schemas";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}

export async function createBlogPost(data: {
  title: string;
  slug: string;
  category: "TEACHING" | "COMPUTATION" | "RESOURCES" | "AI_IN_EDUCATION";
  authorName: string;
}) {
  await requireAdmin();

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      category: data.category,
      authorName: data.authorName,
      isPublished: false,
    },
  });

  revalidatePath("/admin/blog");
  return post.id;
}

export async function updateBlogPost(postId: string, data: BlogPostUpdateData) {
  await requireAdmin();

  const validated = blogPostUpdateSchema.parse(data);

  await prisma.blogPost.update({
    where: { id: postId },
    data: {
      title: validated.title,
      slug: validated.slug,
      excerpt: validated.excerpt ?? null,
      content: validated.content ?? null,
      category: validated.category,
      authorName: validated.authorName,
      authorBio: validated.authorBio ?? null,
      authorImage: validated.authorImage ?? null,
      coverImage: validated.coverImage ?? null,
      isPublished: validated.isPublished,
      publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : null,
    },
  });

  // Sync subjects
  await prisma.blogPostSubject.deleteMany({ where: { blogPostId: postId } });
  if (validated.subjectIds.length > 0) {
    await prisma.blogPostSubject.createMany({
      data: validated.subjectIds.map((subjectId) => ({ blogPostId: postId, subjectId })),
    });
  }

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${postId}`);
  revalidatePath("/blog");

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { slug: true },
  });
  if (post) {
    revalidatePath(`/blog/${post.slug}`);
  }
}

export async function deleteBlogPost(postId: string) {
  await requireAdmin();

  await prisma.blogPost.delete({
    where: { id: postId },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function togglePublishBlogPost(postId: string, publish: boolean) {
  await requireAdmin();

  const existing = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { slug: true, publishedAt: true },
  });

  await prisma.blogPost.update({
    where: { id: postId },
    data: {
      isPublished: publish,
      publishedAt: publish && !existing?.publishedAt ? new Date() : undefined,
    },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  if (existing?.slug) {
    revalidatePath(`/blog/${existing.slug}`);
  }
}
