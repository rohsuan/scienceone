import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import EmptyRecentlyRead from "@/components/dashboard/EmptyRecentlyRead";
import MyLibrary from "@/components/dashboard/MyLibrary";
import { getUserPurchases, getUserResourcePurchases } from "@/lib/purchase-queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<string, string> = {
  LESSON_PLAN: "Lesson Plan",
  PROBLEM_SET: "Problem Set",
  COURSE_MODULE: "Course Module",
  LAB_GUIDE: "Lab Guide",
  SIMULATION: "Simulation",
};

export const metadata: Metadata = {
  title: "Dashboard — ScienceOne",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const userName = session.user.name ?? session.user.email ?? "Reader";
  const [purchases, resourcePurchases] = await Promise.all([
    getUserPurchases(session.user.id),
    getUserResourcePurchases(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <WelcomeSection userName={userName} />

      <MyLibrary purchases={purchases} />

      {/* My Resources section */}
      {resourcePurchases.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl font-semibold mb-4">My Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resourcePurchases.map((rp) => (
              <Link key={rp.id} href={`/resources/${rp.resource.slug}`} className="group">
                <Card className="p-4 transition-shadow group-hover:shadow-md">
                  <div className="flex items-start gap-3">
                    {rp.resource.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rp.resource.coverImage}
                        alt={rp.resource.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-muted-foreground">
                        📄
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{rp.resource.title}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {TYPE_LABELS[rp.resource.type] ?? rp.resource.type}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <EmptyRecentlyRead />
      </div>
    </div>
  );
}
