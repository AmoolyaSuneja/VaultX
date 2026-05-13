import { motion } from 'framer-motion';
import type { VaultEntry } from '@/features/vault/vault.types';
import { VaultCard } from './VaultCard';

interface VaultGridProps {
  entries: VaultEntry[];
  view?: 'grid' | 'list';
  entrancePlaying?: boolean;
  onView: (id: string) => void;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (entry: VaultEntry) => void;
}

function buildTransition(index: number, entrancePlaying: boolean) {
  if (entrancePlaying) {
    // "Pages flowing out of the folder" — each card drops into place with a stagger.
    return {
      delay: 0.1 + Math.min(index, 14) * 0.05,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const
    };
  }

  return {
    delay: Math.min(index, 10) * 0.024,
    duration: 0.35,
    ease: [0.22, 1, 0.36, 1] as const
  };
}

export function VaultGrid({ entries, view = 'grid', entrancePlaying = false, onView, onEdit, onDelete }: VaultGridProps) {
  const containerClasses =
    view === 'list'
      ? 'flex flex-col gap-1.5'
      : 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3';

  const initial = entrancePlaying ? { opacity: 0, y: -18, scale: 0.98 } : { opacity: 0, y: 6 };

  return (
    <div className={containerClasses}>
      {entries.map((entry, index) => (
        <motion.div
          key={entry._id}
          initial={initial}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={buildTransition(index, entrancePlaying)}
          className="transform-gpu will-change-transform"
        >
          <VaultCard
            entry={entry}
            index={index}
            view={view}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </motion.div>
      ))}
    </div>
  );
}
