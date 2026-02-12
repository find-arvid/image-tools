import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <Skeleton className="h-9 w-64 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>

        <div className="space-y-6">
          <div className="border border-border rounded-lg p-6 bg-card/60 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="border border-border rounded-lg p-6 bg-card/60 space-y-3"
              >
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

