import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPostBySlug } from "@/lib/blog-queries";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const CATEGORY_LABELS: Record<string, string> = {
  TEACHING: "Teaching",
  COMPUTATION: "Computation",
  RESOURCES: "Resources",
  AI_IN_EDUCATION: "AI in Education",
};

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) return {};

  return {
    title: `${post.title} | ScienceOne Blog`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.authorName],
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    publisher: {
      "@type": "Organization",
      name: "ScienceOne",
    },
    image: post.coverImage ?? undefined,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://scienceone.com"}/blog/${post.slug}`,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/blog" className="hover:text-foreground transition-colors">
          Blog
        </Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{post.title}</span>
      </div>

      {/* Cover image */}
      {post.coverImage && (
        <div className="aspect-[2/1] rounded-lg overflow-hidden mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Category and date */}
      <div className="flex items-center gap-3 mb-4">
        <Badge variant="outline">
          {CATEGORY_LABELS[post.category] ?? post.category}
        </Badge>
        {post.publishedAt && (
          <time className="text-sm text-muted-foreground">
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
      </div>

      {/* Title */}
      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
        {post.title}
      </h1>

      {/* Author */}
      <div className="flex items-center gap-3 mb-8">
        {post.authorImage && (
          <div className="w-10 h-10 rounded-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.authorImage}
              alt={post.authorName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{post.authorName}</p>
          {post.authorBio && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {post.authorBio}
            </p>
          )}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Content */}
      {post.content && (
        <article
          className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-serif"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />
      )}

      {/* Subject tags */}
      {post.subjects.length > 0 && (
        <>
          <Separator className="my-8" />
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground mr-1">Topics:</span>
            {post.subjects.map(({ subject }) => (
              <Badge key={subject.id} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                {subject.name}
              </Badge>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
