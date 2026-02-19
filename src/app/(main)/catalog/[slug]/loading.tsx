export default function BookDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 lg:gap-12">
        {/* Left column: cover skeleton */}
        <div className="flex flex-col gap-4">
          <div className="aspect-[2/3] w-full bg-muted rounded-lg animate-pulse" />
          <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
        </div>

        {/* Right column: info skeleton */}
        <div className="flex flex-col gap-3">
          {/* Title */}
          <div className="h-10 w-3/4 bg-muted rounded animate-pulse" />
          {/* Author */}
          <div className="h-5 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          {/* Categories */}
          <div className="flex gap-2 mt-2">
            <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
          </div>
          {/* Separator */}
          <div className="h-px bg-muted my-2" />
          {/* Synopsis heading */}
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          {/* Synopsis text */}
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
          {/* TOC */}
          <div className="h-px bg-muted my-2" />
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
