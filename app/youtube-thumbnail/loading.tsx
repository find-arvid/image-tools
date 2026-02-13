import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="text-center space-y-3">
          <Skeleton className="h-8 w-72 mx-auto" />
          <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pb-8">
        <div className="flex flex-col gap-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="w-full">
              <div className="border border-card-border rounded-lg bg-card/60 p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="w-full aspect-video rounded-lg" />
                <Skeleton className="h-9 w-32 mx-auto" />
              </div>
            </div>

            <div className="w-full space-y-6">
              <div className="border-b border-border pb-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ))}
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 border border-card-border rounded-lg px-3 py-2 bg-card/60"
                    >
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-16 rounded-md" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pb-4">
                <Skeleton className="h-6 w-28" />
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-16 w-16 rounded-lg"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

