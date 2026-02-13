import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="min-h-screen w-full max-w-5xl mx-auto px-4 py-10 space-y-12">
      <header className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </header>
      <section className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </section>
    </main>
  );
}
