import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedResources, getSubjects } from "@/lib/resource-queries";
import SimulationCard from "@/components/simulations/SimulationCard";
import ResourceFilters from "@/components/resources/ResourceFilters";

export const metadata: Metadata = {
  title: "Interactive Simulations | ScienceOne",
  description:
    "Explore interactive physics simulations: projectile motion, wave interference, harmonic oscillators, and more.",
};

interface SimulationsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SimulationsPage({ searchParams }: SimulationsPageProps) {
  const params = await searchParams;
  const subject = params.subject ? String(params.subject) : undefined;

  const [{ items: resources }, subjects] = await Promise.all([
    getPublishedResources({ type: "SIMULATION", subject }),
    getSubjects(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold mb-2">Interactive Simulations</h1>
        <p className="text-muted-foreground">
          Explore physics concepts through interactive, adjustable simulations
        </p>
      </div>

      <div className="mb-8">
        <Suspense fallback={<div className="h-10" />}>
          <ResourceFilters subjects={subjects} />
        </Suspense>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No simulations available yet.</p>
          <p className="text-sm mt-2">Check back soon for interactive physics simulations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <SimulationCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
