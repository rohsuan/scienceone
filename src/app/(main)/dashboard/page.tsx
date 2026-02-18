import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import EmptyLibrary from "@/components/dashboard/EmptyLibrary";
import EmptyRecentlyRead from "@/components/dashboard/EmptyRecentlyRead";

export const metadata: Metadata = {
  title: "Dashboard — ScienceOne",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const userName = session.user.name ?? session.user.email ?? "Reader";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <WelcomeSection userName={userName} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmptyLibrary />
        <EmptyRecentlyRead />
      </div>
    </div>
  );
}
