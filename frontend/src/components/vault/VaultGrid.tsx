import type { VaultEntry } from '@/features/vault/vault.types';
import { VaultCard } from './VaultCard';

interface VaultGridProps {
  entries: VaultEntry[];
  onView: (id: string) => void;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (entry: VaultEntry) => void;
}

export function VaultGrid({ entries, onView, onEdit, onDelete }: VaultGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {entries.map((entry, index) => (
        <VaultCard
          key={entry._id}
          entry={entry}
          index={index}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
