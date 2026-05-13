import { ArchiveX } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  copy: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  title,
  copy,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-panel px-6 py-10 text-center animate-fadeIn">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-textMuted">
        <ArchiveX className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-[22px] leading-tight text-textPrimary">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-textMuted">{copy}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
        {secondaryLabel ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="focus-ring press text-sm font-medium text-textPrimary underline-offset-4 hover:underline"
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
