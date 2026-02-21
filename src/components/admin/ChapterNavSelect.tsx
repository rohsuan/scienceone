"use client";

export default function ChapterNavSelect({
  bookId,
  chapters,
  currentSlug,
  hrefPattern,
}: {
  bookId: string;
  chapters: { id: string; slug: string; title: string }[];
  currentSlug: string;
  /** URL pattern with `[slug]` as placeholder, e.g. "/admin/books/abc/chapters/[slug]/edit" */
  hrefPattern?: string;
}) {
  function getHref(slug: string) {
    if (hrefPattern) return hrefPattern.replace("[slug]", slug);
    return `/admin/books/${bookId}/preview/${slug}`;
  }

  return (
    <select
      className="w-full rounded-md border px-3 py-2 text-sm"
      value={currentSlug}
      onChange={(e) => {
        window.location.href = getHref(e.target.value);
      }}
    >
      {chapters.map((ch) => (
        <option key={ch.id} value={ch.slug}>
          {ch.title}
        </option>
      ))}
    </select>
  );
}
