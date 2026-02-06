import InteractiveDotsBackground from '@/components/interactive-dots-background';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <InteractiveDotsBackground
        dotSpacing={24}
        dotColor="rgba(207, 224, 45)"
        baseOpacity={0.12}
        hoverRadius={50}
        hoverScale={1.5}
        hoverOpacity={0.3}
      />
      <div className="flex flex-col items-center justify-center px-4 pt-16 pb-24 relative z-0">
        <div className="text-center max-w-[940px] w-full space-y-16">
          {/* Header skeleton */}
          <div className="flex flex-col items-center gap-6 text-left w-full relative">
            <Skeleton className="h-9 w-80 rounded-full" />
            <Skeleton className="h-12 w-full max-w-md mx-auto" />
            <div className="flex justify-center">
              <Skeleton className="h-5 w-full max-w-2xl" />
            </div>
          </div>

          {/* Cards grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border border-border rounded-lg p-6 bg-card/60 flex flex-col gap-6"
              >
                <Skeleton className="w-full aspect-video rounded-lg" />
                <div className="space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-[85%]" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
