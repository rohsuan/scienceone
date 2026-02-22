"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface ResourceFiltersProps {
  subjects: Subject[];
}

const RESOURCE_TYPES = [
  { value: "LESSON_PLAN", label: "Lesson Plans" },
  { value: "PROBLEM_SET", label: "Problem Sets" },
  { value: "COURSE_MODULE", label: "Course Modules" },
  { value: "LAB_GUIDE", label: "Lab Guides" },
  { value: "SIMULATION", label: "Simulations" },
];

const RESOURCE_LEVELS = [
  { value: "AP", label: "AP" },
  { value: "INTRO_UNIVERSITY", label: "Intro University" },
  { value: "ADVANCED_UNIVERSITY", label: "Advanced" },
];

export default function ResourceFilters({ subjects }: ResourceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSubject = searchParams.get("subject") ?? "";
  const currentType = searchParams.get("type") ?? "";
  const currentLevel = searchParams.get("level") ?? "";
  const currentSort = searchParams.get("sort") ?? "title";

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
      {/* Subject pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={currentSubject === "" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setParam("subject", null)}
        >
          All Subjects
        </Button>
        {subjects.map((subj) => (
          <Button
            key={subj.id}
            variant={currentSubject === subj.slug ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setParam("subject", subj.slug)}
          >
            {subj.name}
          </Button>
        ))}
      </div>

      {/* Type, Level, Sort */}
      <div className="flex flex-wrap gap-3">
        <select
          value={currentType}
          onChange={(e) => setParam("type", e.target.value || null)}
          className="rounded-md border bg-background text-sm px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by type"
        >
          <option value="">All Types</option>
          {RESOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={currentLevel}
          onChange={(e) => setParam("level", e.target.value || null)}
          className="rounded-md border bg-background text-sm px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by level"
        >
          <option value="">All Levels</option>
          {RESOURCE_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        <select
          value={currentSort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="rounded-md border bg-background text-sm px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Sort resources by"
        >
          <option value="title">Title A-Z</option>
          <option value="date">Newest First</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>
    </div>
  );
}
