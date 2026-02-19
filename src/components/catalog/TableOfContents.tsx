import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Chapter {
  id: string;
  title: string;
  position: number;
  isFreePreview: boolean;
}

interface TableOfContentsProps {
  chapters: Chapter[];
}

export default function TableOfContents({ chapters }: TableOfContentsProps) {
  return (
    <div>
      <Separator className="my-6" />
      <h2 className="font-serif text-xl font-semibold mb-4">
        Table of Contents
      </h2>
      <ol className="space-y-2">
        {chapters.map((chapter) => (
          <li
            key={chapter.id}
            className="flex items-center gap-3 text-sm"
          >
            <span className="text-muted-foreground w-6 text-right shrink-0 font-mono">
              {chapter.position}.
            </span>
            <span className="text-foreground">{chapter.title}</span>
            {chapter.isFreePreview && (
              <Badge
                variant="outline"
                className="ml-auto text-xs text-green-600 border-green-600 shrink-0"
              >
                Free
              </Badge>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
