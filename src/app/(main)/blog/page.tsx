import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogPosts, PAGE_SIZE } from "@/lib/blog-queries";
import { getSubjects } from "@/lib/resource-queries";
import BlogPostCard from "@/components/blog/BlogPostCard";
import BlogFilters from "@/components/blog/BlogFilters";
import ResourceSearchInput from "@/components/resources/ResourceSearchInput";
import Pagination from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Blog | ScienceOne",
  description:
    "Articles on teaching, computation, AI in education, and physics resources.",
};

interface BlogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;

  const category = params.category ? String(params.category) : undefined;
  const subject = params.subject ? String(params.subject) : undefined;
  const sort = params.sort ? String(params.sort) : undefined;
  const q = params.q ? String(params.q) : undefined;
  const page = params.page ? Math.max(1, parseInt(String(params.page), 10) || 1) : 1;

  const [{ items: posts, totalCount }, subjects] = await Promise.all([
    getPublishedBlogPosts({ category, subject, sort, q, page }),
    getSubjects(),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif text-3xl font-bold mb-6">Blog</h1>

      <div className="flex flex-col gap-4 mb-8">
        <Suspense fallback={<div className="h-10" />}>
          <ResourceSearchInput />
        </Suspense>

        <Suspense fallback={<div className="h-10" />}>
          <BlogFilters subjects={subjects} />
        </Suspense>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {q ? (
            <>
              <p className="text-lg font-medium mb-2">
                No posts match your search
              </p>
              <p className="text-sm mb-4">
                No results for &ldquo;{q}&rdquo;
              </p>
              <Link
                href="/blog"
                className="text-sm underline underline-offset-4 hover:text-foreground"
              >
                Clear search
              </Link>
            </>
          ) : category || subject ? (
            <p className="text-lg font-medium">No posts match the selected filters.</p>
          ) : (
            <p className="text-lg font-medium">No blog posts yet.</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} />
          )}
        </>
      )}
    </div>
  );
}
