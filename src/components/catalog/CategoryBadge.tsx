import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  className?: string;
}

export default function CategoryBadge({ name, className }: CategoryBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn("rounded-full text-xs", className)}
    >
      {name}
    </Badge>
  );
}
