import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAllResourcesAdmin } from "@/lib/resource-admin-queries";
import ResourceTable from "@/components/admin/ResourceTable";
import CreateResourceDialog from "@/components/admin/CreateResourceDialog";

export const metadata = {
  title: "Resources — Admin | ScienceOne",
};

export default async function AdminResourcesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const resources = await getAllResourcesAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {resources.length} resource{resources.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <CreateResourceDialog />
      </div>

      <ResourceTable data={resources} />
    </div>
  );
}
