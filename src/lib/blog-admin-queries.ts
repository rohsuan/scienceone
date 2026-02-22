import prisma from "@/lib/prisma";

export async function getAllBlogPostsAdmin() {
  return prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      subjects: { include: { subject: true } },
    },
  });
}

export type BlogPostAdminRow = Awaited<ReturnType<typeof getAllBlogPostsAdmin>>[number];

export async function getBlogPostAdmin(postId: string) {
  return prisma.blogPost.findUnique({
    where: { id: postId },
    include: {
      subjects: { include: { subject: true } },
    },
  });
}

export type BlogPostAdminDetail = NonNullable<Awaited<ReturnType<typeof getBlogPostAdmin>>>;
