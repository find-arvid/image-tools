import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full max-w-4xl mx-auto px-4 pt-8 pb-4">
        <div className="text-center space-y-3">
          <Skeleton className="h-8 w-80 mx-auto" />
          <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pb-8">
        <div className="flex min-h-[calc(100vh-20rem)] items-center justify-center">
          <div className="w-full flex flex-col items-center gap-6">
            <Skeleton className="h-40 w-full max-w-xl rounded-lg" />
            <div className="w-full max-w-md space-y-3">
              <Skeleton className="h-4 w-40 mx-auto" />
              <Skeleton className="h-3 w-64 mx-auto" />
              <Skeleton className="h-3 w-56 mx-auto" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </main>
    </div>
  );
}

