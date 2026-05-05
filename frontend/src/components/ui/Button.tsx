import * as React from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<ButtonVariant, string> = {
  primary:
    'border border-brand/25 bg-gradient-to-br from-brand to-accent text-background shadow-soft hover:-translate-y-px hover:shadow-card',
  secondary:
    'border border-brand/25 bg-brand-light text-brand hover:bg-brand hover:text-background',
  ghost:
    'border border-line bg-surface-soft text-textMuted hover:border-brand/35 hover:bg-surface-raised hover:text-textPrimary',
  danger:
    'border border-danger/25 bg-danger/10 text-danger hover:bg-danger hover:text-background'
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', loading = false, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'focus-ring inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      <span className="inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  )
);

Button.displayName = 'Button';
