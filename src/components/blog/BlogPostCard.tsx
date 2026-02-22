import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORY_LABELS: Record<string, string> = {
  TEACHING: "Teaching",
  COMPUTATION: "Computation",
  RESOURCES: "Resources",
  AI_IN_EDUCATION: "AI in Education",
};

interface BlogPostCardProps {
  post: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    category: string;
    authorName: string;
    coverImage: string | null;
    publishedAt: Date | null;
  };
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden gap-0 py-0 transition-shadow group-hover:shadow-md">
        {post.coverImage ? (
          <div className="aspect-[16/9] bg-muted overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
            <span className="text-3xl text-muted-foreground/40">
              {CATEGORY_LABELS[post.category]?.[0] ?? "B"}
            </span>
          </div>
        )}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {CATEGORY_LABELS[post.category] ?? post.category}
            </Badge>
            {post.publishedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          <h2 className="font-serif font-semibold leading-snug line-clamp-2">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post.excerpt}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-auto pt-1">
            {post.authorName}
          </p>
        </div>
      </Card>
    </Link>
  );
}
