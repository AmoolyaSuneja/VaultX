import { FolderKanban, Paperclip, Shield, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui';
import type { VaultStats } from '@/features/vault/vault.types';
import { formatRelativeTime } from '@/lib/utils';

interface StatsStripProps {
  stats: VaultStats;
}

const icons = [Shield, FolderKanban, Paperclip, Sparkles];

export function StatsStrip({ stats }: StatsStripProps) {
  const items = [
    { label: 'Total Entries', shortLabel: 'Entries', value: stats.totalEntries, tone: 'border-t-brand xl:border-l-brand' },
    { label: 'Categories', shortLabel: 'Categories', value: stats.categories, tone: 'border-t-accent xl:border-l-accent' },
    { label: 'Files Attached', shortLabel: 'Files', value: stats.filesAttached, tone: 'border-t-brand xl:border-l-brand' },
    {
      label: 'Last Updated',
      shortLabel: 'Updated',
      value: stats.lastUpdated ? formatRelativeTime(stats.lastUpdated) : 'No changes',
      tone: 'border-t-accent xl:border-l-accent'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 xl:gap-4">
      {items.map((item, index) => {
        const Icon = icons[index];

        return (
          <Card key={item.label} className={`rounded-md border-t-4 p-2 sm:p-3 xl:rounded-lg xl:border-l-4 xl:border-t-0 xl:p-5 ${item.tone} bg-panel/90`}>
            <div className="flex min-h-20 flex-col items-center justify-between gap-2 text-center xl:min-h-0 xl:flex-row xl:items-start xl:text-left">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-textMuted sm:text-xs xl:tracking-[0.22em]">
                  <span className="xl:hidden">{item.shortLabel}</span>
                  <span className="hidden xl:inline">{item.label}</span>
                </p>
                <p className="mt-1 truncate text-base font-semibold text-textPrimary sm:text-lg xl:mt-3 xl:text-2xl">{item.value}</p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-light p-1.5 text-brand xl:p-2">
                <Icon className="h-4 w-4 xl:h-5 xl:w-5" />
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
