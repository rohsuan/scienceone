import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedResources, getSubjects, PAGE_SIZE } from "@/lib/resource-queries";
import ResourceCard from "@/components/resources/ResourceCard";
import ResourceFilters from "@/components/resources/ResourceFilters";
import ResourceSearchInput from "@/components/resources/ResourceSearchInput";
import Pagination from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Resource Library | ScienceOne",
  description:
    "Browse lesson plans, problem sets, lab guides, and course modules for physics and mathematics education.",
};

interface ResourcesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const params = await searchParams;

  const subject = params.subject ? String(params.subject) : undefined;
  const type = params.type ? String(params.type) : undefined;
  const level = params.level ? String(params.level) : undefined;
  const sort = params.sort ? String(params.sort) : undefined;
  const q = params.q ? String(params.q) : undefined;
  const page = params.page ? Math.max(1, parseInt(String(params.page), 10) || 1) : 1;

  const [{ items: resources, totalCount }, subjects] = await Promise.all([
    getPublishedResources({ subject, type, level, sort, q, page }),
    getSubjects(),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif text-3xl font-bold mb-6">Resource Library</h1>

      <div className="flex flex-col gap-4 mb-8">
        <Suspense fallback={<div className="h-10" />}>
          <ResourceSearchInput />
        </Suspense>

        <Suspense fallback={<div className="h-10" />}>
          <ResourceFilters subjects={subjects} />
        </Suspense>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {q ? (
            <>
              <p className="text-lg font-medium mb-2">
                No resources match your search
              </p>
              <p className="text-sm mb-4">
                No results for &ldquo;{q}&rdquo;
              </p>
              <Link
                href="/resources"
                className="text-sm underline underline-offset-4 hover:text-foreground"
              >
                Clear search
              </Link>
            </>
          ) : subject || type || level ? (
            <p className="text-lg font-medium">No resources match the selected filters.</p>
          ) : (
            <p className="text-lg font-medium">No resources available yet.</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
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
