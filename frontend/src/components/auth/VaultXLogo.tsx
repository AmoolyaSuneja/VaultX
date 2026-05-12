import { APP_NAME } from '@/lib/constants';

export function VaultXLogo() {
  return (
    <div className="mx-auto flex w-fit flex-col items-center gap-3 text-center">
      <svg viewBox="0 0 64 64" aria-hidden="true" className="h-10 w-10">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-textPrimary">
          <path d="M23 28v-6a9 9 0 0 1 18 0v6" />
          <rect x="17" y="28" width="30" height="22" rx="5" />
          <circle cx="32" cy="38" r="2.25" />
          <path d="M32 40.25v4.5" />
        </g>
      </svg>
      <div className="flex flex-col items-center">
        <span className="font-heading text-xl font-semibold tracking-tight text-textPrimary">{APP_NAME}</span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-textMuted">
          Private by default
        </span>
      </div>
    </div>
  );
}
