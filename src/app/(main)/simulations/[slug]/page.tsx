import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getResourceBySlug, getRelatedLabGuides } from "@/lib/resource-queries";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SimulationEmbed from "@/components/simulations/SimulationEmbed";

interface SimulationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SimulationDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource) return {};

  return {
    title: `${resource.title} — Simulation | ScienceOne`,
    description: resource.description ?? undefined,
    openGraph: {
      title: resource.title,
      description: resource.description ?? undefined,
    },
  };
}

export default async function SimulationDetailPage({
  params,
}: SimulationDetailPageProps) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource || resource.type !== "SIMULATION") notFound();

  const simulation = resource.simulation;
  const subjectIds = resource.subjects.map(({ subject }) => subject.id);
  const relatedLabGuides = await getRelatedLabGuides(subjectIds, resource.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/simulations" className="hover:text-foreground transition-colors">
          Simulations
        </Link>
        <span>/</span>
        <span className="text-foreground">{resource.title}</span>
      </div>

      {/* Title and badges */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className="bg-blue-600 text-white">Interactive Simulation</Badge>
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
          <p className="text-lg text-muted-foreground">
            {resource.description}
          </p>
        )}
      </div>

      {/* Simulation embed */}
      {simulation?.componentKey && (
        <div className="mb-8">
          <SimulationEmbed componentKey={simulation.componentKey} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
        {/* Main content */}
        <div>
          {/* Resource content */}
          {resource.content && (
            <>
              <Separator className="my-6" />
              <article
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(resource.content) }}
              />
            </>
          )}

          {/* Teacher guide */}
          {simulation?.teacherGuide && (
            <>
              <Separator className="my-6" />
              <h2 className="font-serif text-xl font-semibold mb-4">Teacher Guide</h2>
              <article
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(simulation.teacherGuide) }}
              />
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {simulation?.parameterDocs && (
            <div className="sticky top-24">
              <h3 className="font-semibold text-sm mb-3">Parameter Documentation</h3>
              <article
                className="prose prose-sm prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(simulation.parameterDocs) }}
              />
            </div>
          )}

          {/* Related Lab Guides */}
          {relatedLabGuides.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3">Related Lab Guides</h3>
              <ul className="space-y-2">
                {relatedLabGuides.map((lg) => (
                  <li key={lg.id}>
                    <Link
                      href={`/resources/${lg.slug}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {lg.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">
              {resource.viewCount.toLocaleString()} views
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
