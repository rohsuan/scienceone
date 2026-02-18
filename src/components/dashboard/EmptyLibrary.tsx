import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EmptyLibrary() {
  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
        My Library
      </h2>
      <Card className="border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="sr-only">My Library</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 px-8 text-center">
          {/* Book icon */}
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
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <p className="text-base font-medium text-foreground mb-1">
            Your library is empty
          </p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Books you purchase will appear here
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/catalog">Browse Catalog</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
