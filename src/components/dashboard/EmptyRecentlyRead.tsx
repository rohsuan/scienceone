import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmptyRecentlyRead() {
  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
        Recently Read
      </h2>
      <Card className="border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="sr-only">Recently Read</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 px-8 text-center">
          {/* Bookmark/reading icon */}
          <div className="mb-5 text-muted-foreground/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-base font-medium text-foreground mb-1">
            Nothing read yet
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your reading history will appear here as you explore our collection
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
