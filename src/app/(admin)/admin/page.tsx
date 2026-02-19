import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAllBooksAdmin } from "@/lib/admin-queries";
import BookTable from "@/components/admin/BookTable";
import CreateBookDialog from "@/components/admin/CreateBookDialog";

export const metadata = {
  title: "Books — Admin | ScienceOne",
};

export default async function AdminBooksPage() {
  // Defense-in-depth: check admin role again (layout also checks)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const books = await getAllBooksAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Books</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {books.length} book{books.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <CreateBookDialog />
      </div>

      <BookTable data={books} />
    </div>
  );
}
