import { notFound, redirect } from "next/navigation";
import { getBookChapters } from "@/lib/reader-queries";

export default async function BookEntryPage({
  params,
}: {
  params: Promise<{ bookSlug: string }>;
}) {
  const { bookSlug } = await params;
  const book = await getBookChapters(bookSlug);

  if (!book || book.chapters.length === 0) {
    notFound();
  }

  redirect(`/read/${bookSlug}/${book.chapters[0].slug}`);
}
