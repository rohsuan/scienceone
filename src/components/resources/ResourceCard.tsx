import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<string, string> = {
  LESSON_PLAN: "Lesson Plan",
  PROBLEM_SET: "Problem Set",
  COURSE_MODULE: "Course Module",
  LAB_GUIDE: "Lab Guide",
  SIMULATION: "Simulation",
};

const LEVEL_LABELS: Record<string, string> = {
  AP: "AP",
  INTRO_UNIVERSITY: "Intro University",
  ADVANCED_UNIVERSITY: "Advanced",
};

interface ResourceCardProps {
  resource: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    type: string;
    level: string;
    isFree: boolean;
    coverImage: string | null;
    subjects: {
      subject: {
        id: string;
        name: string;
        slug: string;
      };
    }[];
    pricing: {
      amount: number | import("@prisma/client/runtime/client").Decimal;
    } | null;
  };
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const href = resource.type === "SIMULATION"
    ? `/simulations/${resource.slug}`
    : `/resources/${resource.slug}`;

  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full overflow-hidden gap-0 py-0 transition-shadow group-hover:shadow-md">
        {resource.coverImage ? (
          <div className="aspect-[16/9] bg-muted overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resource.coverImage}
              alt={resource.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-muted flex items-center justify-center">
            <span className="text-3xl text-muted-foreground/40">
              {resource.type === "SIMULATION" ? "⚡" : "📄"}
            </span>
          </div>
        )}
        <div className="p-4 flex flex-col gap-2">
          <h2 className="font-serif font-semibold leading-snug line-clamp-2 text-sm">
            {resource.title}
          </h2>
          {resource.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {resource.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {TYPE_LABELS[resource.type] ?? resource.type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {LEVEL_LABELS[resource.level] ?? resource.level}
            </Badge>
          </div>
          {resource.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.subjects.slice(0, 2).map(({ subject }) => (
                <Badge key={subject.id} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {subject.name}
                </Badge>
              ))}
            </div>
          )}
          <div className="mt-auto pt-1">
            {resource.isFree ? (
              <Badge variant="secondary" className="rounded-full text-xs bg-green-100 text-green-700 border-green-200">
                Free
              </Badge>
            ) : resource.pricing ? (
              <span className="text-xs text-muted-foreground">
                ${Number(resource.pricing.amount).toFixed(2)}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
