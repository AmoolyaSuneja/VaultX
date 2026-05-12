import type { VaultEntry } from '@/features/vault/vault.types';
import { VaultCard } from './VaultCard';

interface VaultGridProps {
  entries: VaultEntry[];
  view?: 'grid' | 'list';
  onView: (id: string) => void;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (entry: VaultEntry) => void;
}

export function VaultGrid({ entries, view = 'grid', onView, onEdit, onDelete }: VaultGridProps) {
  if (view === 'list') {
    return (
      <div className="flex flex-col gap-1.5">
        {entries.map((entry, index) => (
          <VaultCard
            key={entry._id}
            entry={entry}
            index={index}
            view="list"
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry, index) => (
        <VaultCard
          key={entry._id}
          entry={entry}
          index={index}
          view="grid"
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
