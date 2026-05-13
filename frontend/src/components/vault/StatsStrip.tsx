import type { VaultStats } from '@/features/vault/vault.types';
import { formatRelativeTime } from '@/lib/utils';

interface StatsStripProps {
  stats: VaultStats;
}

function compactRelativeLabel(value: string) {
  return value
    .replace(/^about\s+/i, '')
    .replace(/\bminutes?\b/i, 'm')
    .replace(/\bhours?\b/i, 'h')
    .replace(/\bdays?\b/i, 'd')
    .replace(/\bmonths?\b/i, 'mo')
    .replace(/\byears?\b/i, 'y');
}

export function StatsStrip({ stats }: StatsStripProps) {
  const updatedValue = stats.lastUpdated ? formatRelativeTime(stats.lastUpdated) : '—';
  const items = [
    { label: 'Entries', value: stats.totalEntries, compact: String(stats.totalEntries) },
    { label: 'Categories', value: stats.categories, compact: String(stats.categories) },
    { label: 'Files', value: stats.filesAttached, compact: String(stats.filesAttached) },
    { label: 'Updated', value: updatedValue, compact: compactRelativeLabel(updatedValue) }
  ];

  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel sm:grid-cols-4 sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-2 px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-[11px] font-medium uppercase tracking-label text-textMuted">{item.label}</p>
          <p className="font-heading text-[22px] font-semibold leading-none text-textPrimary tabular sm:text-[24px]">
            <span className="sm:hidden">{item.compact}</span>
            <span className="hidden sm:inline">{item.value}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
