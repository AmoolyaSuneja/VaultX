import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'glass-panel transform-gpu rounded-lg p-4 shadow-soft transition-[border-color,box-shadow,transform] duration-300 ease-out sm:p-5',
        className
      )}
      {...props}
    />
  );
}
