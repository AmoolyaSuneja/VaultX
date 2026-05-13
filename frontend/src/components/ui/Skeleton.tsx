import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton', className)} aria-hidden="true" {...props} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}
