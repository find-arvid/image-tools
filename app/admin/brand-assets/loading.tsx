import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="min-h-screen w-full max-w-6xl mx-auto px-4 py-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-40" />
        </div>
      </header>

      <section className="space-y-4 border border-border rounded-lg p-4 bg-card/60">
        <Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
      </section>

      <section className="space-y-4 border border-border rounded-lg p-4 bg-card/60">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="md:col-span-2 space-y-3">
            <Skeleton className="h-4 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-border rounded-md p-3 bg-background/40 space-y-3"
                >
                  <Skeleton className="h-10 w-full rounded-sm" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

