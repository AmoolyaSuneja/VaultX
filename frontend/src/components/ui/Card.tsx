import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'glass-panel transform-gpu rounded-lg p-5 shadow-soft transition-[border-color,box-shadow,transform] duration-300 ease-out',
        className
      )}
      {...props}
    />
  );
}
