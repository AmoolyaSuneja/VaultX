import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'panel rounded-lg p-5 sm:p-6',
        'transition-[border-color,box-shadow] duration-280 ease-smooth',
        className
      )}
      {...props}
    />
  );
}
