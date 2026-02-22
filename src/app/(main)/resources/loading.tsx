export default function ResourcesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-9 w-56 bg-muted rounded animate-pulse mb-6" />

      <div className="flex flex-col gap-4 mb-8">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border overflow-hidden animate-pulse"
          >
            <div className="aspect-[16/9] bg-muted" />
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="flex gap-1">
                <div className="h-5 bg-muted rounded w-20" />
                <div className="h-5 bg-muted rounded w-16" />
              </div>
              <div className="h-5 bg-muted rounded w-12 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
