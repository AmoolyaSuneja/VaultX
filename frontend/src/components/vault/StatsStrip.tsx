import { FolderKanban, Paperclip, Shield, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui';
import type { VaultStats } from '@/features/vault/vault.types';
import { formatRelativeTime } from '@/lib/utils';

interface StatsStripProps {
  stats: VaultStats;
}

const icons = [Shield, FolderKanban, Paperclip, Sparkles];

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
  const updatedValue = stats.lastUpdated ? formatRelativeTime(stats.lastUpdated) : 'No changes';
  const items = [
    { label: 'Total Entries', shortLabel: 'Entries', value: stats.totalEntries, mobileValue: stats.totalEntries, tone: 'border-t-brand xl:border-l-brand' },
    { label: 'Categories', shortLabel: 'Categories', value: stats.categories, mobileValue: stats.categories, tone: 'border-t-accent xl:border-l-accent' },
    { label: 'Files Attached', shortLabel: 'Files', value: stats.filesAttached, mobileValue: stats.filesAttached, tone: 'border-t-brand xl:border-l-brand' },
    {
      label: 'Last Updated',
      shortLabel: 'Updated',
      value: updatedValue,
      mobileValue: compactRelativeLabel(updatedValue),
      tone: 'border-t-accent xl:border-l-accent'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 xl:gap-4">
      {items.map((item, index) => {
        const Icon = icons[index];

        return (
          <Card key={item.label} className={`overflow-hidden rounded-md border-t-4 p-2 sm:p-3 xl:rounded-lg xl:border-l-4 xl:border-t-0 xl:p-5 ${item.tone} bg-panel/90`}>
            <div className="flex min-h-24 flex-col items-center justify-start gap-2 text-center xl:min-h-0 xl:flex-row-reverse xl:items-start xl:justify-between xl:text-left">
              <span className="shrink-0 rounded-full bg-brand-light p-1.5 text-brand xl:p-2">
                <Icon className="h-4 w-4 xl:h-5 xl:w-5" />
              </span>
              <div className="min-w-0 w-full">
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-textMuted sm:text-xs xl:tracking-[0.22em]">
                  <span className="xl:hidden">{item.shortLabel}</span>
                  <span className="hidden xl:inline">{item.label}</span>
                </p>
                <p className="mt-1 w-full overflow-hidden break-words text-sm font-semibold leading-tight text-textPrimary sm:text-lg xl:mt-3 xl:truncate xl:text-2xl">
                  <span className="xl:hidden">{item.mobileValue}</span>
                  <span className="hidden xl:inline">{item.value}</span>
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
