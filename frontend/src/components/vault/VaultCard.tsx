import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Copy, Ellipsis, Eye, FileText, LockKeyhole, Pencil, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui';
import { copyToClipboard, formatDateTime, formatRelativeTime, isUnlockPending, maskValue, truncate } from '@/lib/utils';
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

  return (
    <article
      role="article"
      aria-label={`${entry.title} entry`}
      className="group flex cursor-pointer flex-col justify-between gap-4 rounded-lg border border-line bg-panel p-5 transition-colors duration-200 ease-out hover:border-textPrimary/25"
      onClick={() => onView(entry._id)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{entry.category || 'General'}</Badge>
            {nomineeAccess ? (
              <Badge variant="status" statusTone="archived" className="gap-1.5">
                <ShieldCheck className="h-3 w-3" />
                {ownerLabel ? `Nominee: ${ownerLabel}` : 'Nominee'}
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-3 truncate font-heading text-lg font-semibold text-textPrimary">{entry.title}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-textMuted">
            {locked
              ? `Locked until ${formatDateTime(entry.unlockAt)}`
              : entry.username || entry.url || truncate(entry.notes || entry.data || 'No subtitle yet', 52)}
          </p>
        </div>
        <Menu as="div" className="relative">
          <MenuButton
            onClick={(event) => event.stopPropagation()}
            className="focus-ring rounded-full p-1.5 text-textMuted transition-colors hover:bg-surface-muted hover:text-textPrimary"
            aria-label="Entry actions"
          >
            <Ellipsis className="h-4 w-4" />
          </MenuButton>
          <MenuItems
            anchor="bottom end"
            className="z-[70] mt-2 min-w-[180px] rounded-md border border-line bg-panel p-1 shadow-card"
          >
            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onView(entry._id);
                  }}
                  className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm ${focus ? 'bg-surface-muted text-textPrimary' : 'text-textPrimary'}`}
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
                    className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm ${focus ? 'bg-surface-muted text-textPrimary' : 'text-textPrimary'}`}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </MenuItem>
            ) : null}
            {!locked && role === 'owner' && entry.password ? (
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={async (event) => {
                      event.stopPropagation();
                      const copied = await copyToClipboard(entry.password || '');
                      if (copied) toast.success('Password copied');
                    }}
                    className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm ${focus ? 'bg-surface-muted text-textPrimary' : 'text-textPrimary'}`}
                  >
                    <Copy className="h-4 w-4" />
                    Copy password
                  </button>
                )}
              </MenuItem>
            ) : null}
            {role === 'owner' ? (
              <>
                <div className="my-1 h-px bg-line" />
                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(entry);
                      }}
                      className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-danger ${focus ? 'bg-danger-light/40' : ''}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </MenuItem>
              </>
            ) : null}
          </MenuItems>
        </Menu>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs text-textMuted">
        {locked ? (
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole className="h-3.5 w-3.5" />
            Locked
          </span>
        ) : null}
        {dualApproval ? (
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Two-person
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {entry.attachmentCount ?? entry.filePath?.length ?? 0} files
        </span>
        <span className="ml-auto">{formatRelativeTime(entry.updatedAt || entry.createdAt)}</span>
      </div>

      {entry.password && !locked && role === 'owner' ? (
        <div className="flex items-center gap-2 text-xs">
          <span className="truncate font-mono text-textPrimary">{maskValue(entry.password, revealed)}</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setRevealed((value) => !value);
            }}
            className="focus-ring ml-auto rounded-full p-1 text-textMuted hover:text-textPrimary"
            aria-label={revealed ? 'Hide password' : 'Reveal password'}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {revealed ? (
            <button
              type="button"
              aria-label="Copy revealed password"
              className="focus-ring rounded-full p-1 text-textMuted hover:text-textPrimary"
              onClick={async (event) => {
                event.stopPropagation();
                const copied = await copyToClipboard(entry.password || '');
                if (copied) toast.success('Password copied');
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
