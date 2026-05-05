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
    { label: 'Total Entries', value: stats.totalEntries, tone: 'border-l-brand' },
    { label: 'Categories', value: stats.categories, tone: 'border-l-accent' },
    { label: 'Files Attached', value: stats.filesAttached, tone: 'border-l-brand' },
    { label: 'Last Updated', value: stats.lastUpdated ? formatRelativeTime(stats.lastUpdated) : 'No changes', tone: 'border-l-accent' }
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = icons[index];

        return (
          <Card key={item.label} className={`rounded-lg border-l-4 ${item.tone} bg-panel/90`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-textMuted">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold text-textPrimary">{item.value}</p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-light p-2 text-brand">
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
