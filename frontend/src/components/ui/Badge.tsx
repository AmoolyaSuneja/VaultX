import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'category' | 'status';
  statusTone?: 'active' | 'archived' | 'flagged';
  className?: string;
}

export function Badge({ children, variant = 'category', statusTone = 'active', className }: BadgeProps) {
  const styles =
    variant === 'status' && statusTone === 'flagged'
      ? 'border border-danger/30 bg-danger-light/40 text-danger'
      : variant === 'status' && statusTone === 'archived'
        ? 'border border-line bg-surface-muted text-textMuted'
        : variant === 'status'
          ? 'border border-line bg-surface-muted text-textPrimary'
          : 'border border-line bg-surface-muted text-textMuted';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
        styles,
        className
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-textMuted/60" />
      {children}
    </span>
  );
}
