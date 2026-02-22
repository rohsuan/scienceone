import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getResourceAdmin, getAllSubjects } from "@/lib/resource-admin-queries";
import ResourceEditForm from "@/components/admin/ResourceEditForm";
import { SIMULATION_KEYS } from "@/lib/simulation-keys";
import { ChevronLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = await getResourceAdmin(resourceId);
  return {
    title: resource
      ? `Edit: ${resource.title} — Admin | ScienceOne`
      : "Edit Resource — Admin | ScienceOne",
  };
}

export default async function ResourceEditPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const { resourceId } = await params;

  const [resource, subjects] = await Promise.all([
    getResourceAdmin(resourceId),
    getAllSubjects(),
  ]);

  if (!resource) {
    redirect("/admin/resources");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/resources"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Resources
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{resource.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Edit resource details and publishing settings
        </p>
      </div>

      <ResourceEditForm
        resource={resource}
        subjects={subjects}
        simulationKeys={SIMULATION_KEYS}
      />
    </div>
  );
}
