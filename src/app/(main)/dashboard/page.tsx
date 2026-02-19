import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import EmptyRecentlyRead from "@/components/dashboard/EmptyRecentlyRead";
import MyLibrary from "@/components/dashboard/MyLibrary";
import { getUserPurchases } from "@/lib/purchase-queries";

export const metadata: Metadata = {
  title: "Dashboard — ScienceOne",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const userName = session.user.name ?? session.user.email ?? "Reader";
  const purchases = await getUserPurchases(session.user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <WelcomeSection userName={userName} />

      <MyLibrary purchases={purchases} />

      <div className="mt-6">
        <EmptyRecentlyRead />
      </div>
    </div>
  );
}
