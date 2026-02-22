import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getResourceBySlug } from "@/lib/resource-queries";
import { hasResourcePurchase } from "@/lib/resource-queries";
import { auth } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ResourceBuyButton from "@/components/resources/ResourceBuyButton";
import ResourceDownloadButton from "@/components/resources/ResourceDownloadButton";

const TYPE_LABELS: Record<string, string> = {
  LESSON_PLAN: "Lesson Plan",
  PROBLEM_SET: "Problem Set",
  COURSE_MODULE: "Course Module",
  LAB_GUIDE: "Lab Guide",
  SIMULATION: "Simulation",
};

const LEVEL_LABELS: Record<string, string> = {
  AP: "AP",
  INTRO_UNIVERSITY: "Intro University",
  ADVANCED_UNIVERSITY: "Advanced University",
};

interface ResourceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ResourceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource) return {};

  return {
    title: `${resource.title} | ScienceOne`,
    description: resource.description ?? undefined,
    openGraph: {
      title: resource.title,
      description: resource.description ?? undefined,
      images: resource.coverImage ? [resource.coverImage] : [],
    },
  };
}

export default async function ResourceDetailPage({
  params,
}: ResourceDetailPageProps) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource) notFound();

  // Redirect simulations to their dedicated page
  if (resource.type === "SIMULATION") {
    const { redirect } = await import("next/navigation");
    redirect(`/simulations/${slug}`);
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const purchased = session
    ? await hasResourcePurchase(session.user.id, resource.id)
    : false;

  const canAccess = resource.isFree || purchased;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 lg:gap-12">
        {/* Main content */}
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/resources" className="hover:text-foreground transition-colors">
              Resources
            </Link>
            <span>/</span>
            <span className="text-foreground">{resource.title}</span>
          </div>

          {/* Cover image */}
          {resource.coverImage && (
            <div className="aspect-[16/9] rounded-lg overflow-hidden mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resource.coverImage}
                alt={resource.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">
              {TYPE_LABELS[resource.type] ?? resource.type}
            </Badge>
            <Badge variant="secondary">
              {LEVEL_LABELS[resource.level] ?? resource.level}
            </Badge>
            {resource.subjects.map(({ subject }) => (
              <Badge key={subject.id} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                {subject.name}
              </Badge>
            ))}
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
            {resource.title}
          </h1>

          {resource.description && (
            <p className="text-lg text-muted-foreground mb-6">
              {resource.description}
            </p>
          )}

          <Separator className="my-6" />

          {/* Content */}
          {resource.content && (
            <article
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(resource.content) }}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="sticky top-24 space-y-4">
            {/* Access / Purchase */}
            {resource.isFree ? (
              <Badge className="bg-green-600 hover:bg-green-700 text-white">
                Free Resource
              </Badge>
            ) : resource.pricing ? (
              <p className="text-lg font-semibold">
                ${Number(resource.pricing.amount).toFixed(2)}
              </p>
            ) : null}

            {/* Download button */}
            {canAccess && resource.fileKey && (
              <ResourceDownloadButton
                resourceId={resource.id}
                fileName={resource.fileName}
              />
            )}

            {/* Buy button */}
            {!canAccess && resource.pricing && (
              <>
                {session ? (
                  <ResourceBuyButton
                    resourceId={resource.id}
                    price={Number(resource.pricing.amount)}
                  />
                ) : (
                  <Button className="w-full" asChild>
                    <Link href={`/sign-in?redirect=/resources/${resource.slug}`}>
                      Sign In to Purchase
                    </Link>
                  </Button>
                )}
              </>
            )}

            {/* View count */}
            <p className="text-sm text-muted-foreground">
              {resource.viewCount.toLocaleString()} views
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
