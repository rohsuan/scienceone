"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface BlogFiltersProps {
  subjects: Subject[];
}

const BLOG_CATEGORIES = [
  { value: "TEACHING", label: "Teaching" },
  { value: "COMPUTATION", label: "Computation" },
  { value: "RESOURCES", label: "Resources" },
  { value: "AI_IN_EDUCATION", label: "AI in Education" },
];

export default function BlogFilters({ subjects }: BlogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "";
  const currentSubject = searchParams.get("subject") ?? "";
  const currentSort = searchParams.get("sort") ?? "newest";

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-3">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={currentCategory === "" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setParam("category", null)}
        >
          All
        </Button>
        {BLOG_CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={currentCategory === cat.value ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setParam("category", cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Subject pills + sort */}
      <div className="flex flex-wrap items-center gap-2">
        {subjects.length > 0 && (
          <>
            <Button
              variant={currentSubject === "" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setParam("subject", null)}
            >
              All Topics
            </Button>
            {subjects.map((subj) => (
              <Button
                key={subj.id}
                variant={currentSubject === subj.slug ? "secondary" : "ghost"}
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setParam("subject", subj.slug)}
              >
                {subj.name}
              </Button>
            ))}
          </>
        )}

        <select
          value={currentSort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="ml-auto rounded-md border bg-background text-sm px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Sort posts by"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  );
}
