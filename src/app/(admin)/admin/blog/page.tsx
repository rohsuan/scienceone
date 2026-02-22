import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAllBlogPostsAdmin } from "@/lib/blog-admin-queries";
import BlogPostTable from "@/components/admin/BlogPostTable";
import CreateBlogPostDialog from "@/components/admin/CreateBlogPostDialog";

export const metadata = {
  title: "Blog Posts — Admin | ScienceOne",
};

export default async function AdminBlogPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const posts = await getAllBlogPostsAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {posts.length} post{posts.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <CreateBlogPostDialog />
      </div>

      <BlogPostTable data={posts} />
    </div>
  );
}
