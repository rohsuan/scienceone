export default function ResourceDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 lg:gap-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="aspect-[16/9] bg-muted rounded-lg" />
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-muted rounded" />
            <div className="h-6 w-28 bg-muted rounded" />
          </div>
          <div className="h-10 w-3/4 bg-muted rounded" />
          <div className="h-5 w-full bg-muted rounded" />
          <div className="h-px bg-muted w-full my-6" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-20 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
