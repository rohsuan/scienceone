import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getBlogPostAdmin } from "@/lib/blog-admin-queries";
import { getAllSubjects } from "@/lib/resource-admin-queries";
import BlogPostEditForm from "@/components/admin/BlogPostEditForm";
import { ChevronLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await getBlogPostAdmin(postId);
  return {
    title: post
      ? `Edit: ${post.title} — Admin | ScienceOne`
      : "Edit Post — Admin | ScienceOne",
  };
}

export default async function BlogPostEditPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const { postId } = await params;

  const [post, subjects] = await Promise.all([
    getBlogPostAdmin(postId),
    getAllSubjects(),
  ]);

  if (!post) {
    redirect("/admin/blog");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Posts
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Edit post details and publishing settings
        </p>
      </div>

      <BlogPostEditForm post={post} subjects={subjects} />
    </div>
  );
}
