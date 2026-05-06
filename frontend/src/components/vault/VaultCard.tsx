import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Ellipsis, Eye, FileText, LockKeyhole, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui';
import { copyToClipboard, formatDateTime, formatRelativeTime, isUnlockPending, maskValue, truncate } from '@/lib/utils';
import { categoryPalette } from '@/lib/constants';
import type { VaultEntry } from '@/features/vault/vault.types';

interface VaultCardProps {
  entry: VaultEntry;
  index: number;
  onView: (id: string) => void;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (entry: VaultEntry) => void;
}

export function VaultCard({ entry, index, onView, onEdit, onDelete }: VaultCardProps) {
  const [revealed, setRevealed] = useState(false);
  const locked = isUnlockPending(entry.unlockAt);
  const role = entry.accessPolicy?.role || 'owner';
  const dualApproval = entry.accessPolicy?.requiresDualApproval;
  const nomineeAccess = role === 'nominee';
  const ownerLabel = entry.accessPolicy?.owner?.name || entry.accessPolicy?.owner?.email;
  void index;

  useEffect(() => {
    if (!revealed) return;
    const timer = window.setTimeout(() => setRevealed(false), 15000);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  const categoryClass = categoryPalette[entry.category] ?? categoryPalette.General;

  return (
    <article
      role="article"
      aria-label={`${entry.title} entry`}
      className="group glass-panel flex transform-gpu cursor-pointer flex-col gap-4 rounded-lg p-4 shadow-soft transition-[border-color,box-shadow,transform] duration-300 ease-out will-change-transform hover:-translate-y-1 hover:border-brand/30 hover:shadow-card sm:gap-5 sm:p-5"
      onClick={() => onView(entry._id)}
    >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={categoryClass}>{entry.category || 'General'}</Badge>
              {nomineeAccess ? (
                <Badge variant="status" statusTone="archived" className="gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {ownerLabel ? `Nominee access: ${ownerLabel}` : 'Nominee access'}
                </Badge>
              ) : null}
            </div>
            <Menu as="div" className="relative">
              <MenuButton
                onClick={(event) => event.stopPropagation()}
                className="focus-ring rounded-full p-2 text-textMuted opacity-100 transition hover:bg-surface-raised hover:text-brand sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Entry actions"
              >
                <Ellipsis className="h-4 w-4" />
              </MenuButton>
              <MenuItems
                anchor="bottom end"
                className="z-[70] mt-2 min-w-[180px] rounded-xl border border-line bg-panel p-2 shadow-card backdrop-blur-panel"
              >
                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onView(entry._id);
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${focus ? 'bg-surface-raised text-brand' : 'text-textPrimary'}`}
                    >
                      <Eye className="h-4 w-4" />
                      {locked ? 'View status' : 'View'}
                    </button>
                  )}
                </MenuItem>
                {!locked && role === 'owner' ? (
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(entry);
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${focus ? 'bg-surface-raised text-brand' : 'text-textPrimary'}`}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    )}
                  </MenuItem>
                ) : null}
                {!locked && role === 'owner' ? (
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type="button"
                        onClick={async (event) => {
                          event.stopPropagation();
                          const copied = await copyToClipboard(entry.password || '');
                          if (copied) toast.success('Password copied');
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${focus ? 'bg-surface-raised text-brand' : 'text-textPrimary'}`}
                      >
                        <Copy className="h-4 w-4" />
                        Copy password
                      </button>
                    )}
                  </MenuItem>
                ) : null}
                {role === 'owner' ? (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(entry);
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${focus ? 'bg-danger/10' : ''} text-danger`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </MenuItem>
                ) : null}
              </MenuItems>
            </Menu>
          </div>

          <div className="min-w-0 space-y-2">
            <h3 className="truncate font-heading text-lg font-semibold text-textPrimary sm:text-xl">{entry.title}</h3>
            <p className="line-clamp-1 text-sm text-textMuted">
              {locked
                ? `Locked until ${formatDateTime(entry.unlockAt)}`
                : entry.username || entry.url || truncate(entry.notes || entry.data || 'No subtitle yet', 52)}
            </p>
          </div>
        </div>

        <div className="border-t border-line/80 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-textMuted sm:gap-3 sm:text-sm">
            {locked ? (
              <Badge variant="status" statusTone="archived" className="gap-1.5">
                <LockKeyhole className="h-3.5 w-3.5" />
                Locked
              </Badge>
            ) : null}
            {dualApproval ? (
              <Badge variant="status" statusTone="active" className="gap-1.5">
                <LockKeyhole className="h-3.5 w-3.5" />
                Two-person
              </Badge>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5">
              <FileText className="h-4 w-4 text-brand" />
              {entry.attachmentCount ?? entry.filePath?.length ?? 0} files
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5">
              {formatRelativeTime(entry.updatedAt || entry.createdAt)}
            </span>
            {entry.password && !locked && role === 'owner' ? (
              <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-textPrimary">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={revealed ? 'revealed' : 'hidden'}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-[10rem] truncate font-medium sm:max-w-none"
                  >
                    {maskValue(entry.password, revealed)}
                  </motion.span>
                </AnimatePresence>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setRevealed((value) => !value);
                  }}
                  className="focus-ring rounded-full p-1 text-textMuted hover:text-brand"
                  aria-label={revealed ? 'Hide password' : 'Reveal password'}
                >
                  <Eye className="h-4 w-4" />
                </button>
                {revealed ? (
                  <button
                    type="button"
                    aria-label="Copy revealed password"
                    className="focus-ring rounded-full p-1 text-textMuted hover:text-brand"
                    onClick={async (event) => {
                      event.stopPropagation();
                      const copied = await copyToClipboard(entry.password || '');
                      if (copied) toast.success('Password copied');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </article>
  );
}
