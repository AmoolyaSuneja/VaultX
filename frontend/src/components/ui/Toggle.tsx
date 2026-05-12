import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="focus-ring flex w-full items-center justify-between gap-4 rounded-md border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:bg-surface-muted"
    >
      <span className="text-sm text-textPrimary">{label}</span>
      <span
        className={cn(
          'flex h-5 w-9 items-center rounded-full p-0.5 transition-colors',
          checked ? 'bg-brand' : 'bg-surface-sunken'
        )}
      >
        <span
          className={cn(
            'h-4 w-4 rounded-full bg-background shadow-sm transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </span>
    </button>
  );
}
