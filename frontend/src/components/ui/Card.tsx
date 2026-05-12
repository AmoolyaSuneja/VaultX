import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'panel rounded-lg p-4 transition-shadow duration-200 ease-out sm:p-5',
        className
      )}
      {...props}
    />
  );
}
