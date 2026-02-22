import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

interface SimulationCardProps {
  resource: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    subjects: {
      subject: {
        id: string;
        name: string;
        slug: string;
      };
    }[];
  };
}

export default function SimulationCard({ resource }: SimulationCardProps) {
  return (
    <Link href={`/simulations/${resource.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden gap-0 py-0 transition-shadow group-hover:shadow-md">
        <div className="aspect-[16/9] bg-muted relative overflow-hidden">
          {resource.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resource.coverImage}
              alt={resource.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <Play className="h-12 w-12 text-blue-400 group-hover:text-blue-600 transition-colors" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-600 text-white text-xs">Interactive</Badge>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-2">
          <h2 className="font-serif font-semibold leading-snug line-clamp-2 text-sm">
            {resource.title}
          </h2>
          {resource.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {resource.description}
            </p>
          )}
          {resource.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.subjects.slice(0, 3).map(({ subject }) => (
                <Badge key={subject.id} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {subject.name}
                </Badge>
              ))}
            </div>
          )}
          <div className="mt-auto pt-1">
            <Badge variant="secondary" className="rounded-full text-xs bg-green-100 text-green-700 border-green-200">
              Free
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
