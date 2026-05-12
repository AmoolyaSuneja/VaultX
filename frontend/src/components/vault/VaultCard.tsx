import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Copy, Ellipsis, Eye, FileText, LockKeyhole, Pencil, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { copyToClipboard, formatRelativeTime, isUnlockPending, maskValue, truncate } from '@/lib/utils';
import { getCategoryIcon } from '@/lib/categoryIcons';
import type { VaultEntry } from '@/features/vault/vault.types';

interface VaultCardProps {
  entry: VaultEntry;
  index: number;
  view?: 'grid' | 'list';
  onView: (id: string) => void;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (entry: VaultEntry) => void;
}

export function VaultCard({ entry, index, view = 'grid', onView, onEdit, onDelete }: VaultCardProps) {
  const [revealed, setRevealed] = useState(false);
  const locked = isUnlockPending(entry.unlockAt);
  const role = entry.accessPolicy?.role || 'owner';
  const dualApproval = entry.accessPolicy?.requiresDualApproval;
  const nomineeAccess = role === 'nominee';
  const ownerLabel = entry.accessPolicy?.owner?.name || entry.accessPolicy?.owner?.email;
  const CategoryIcon = getCategoryIcon(entry.category);
  const subtitle =
    entry.username ||
    entry.url ||
    (entry.notes || entry.data ? truncate(entry.notes || entry.data || '', 64) : '');
  const attachmentCount = entry.attachmentCount ?? entry.filePath?.length ?? 0;
  const showPasswordRow = Boolean(entry.password) && !locked && role === 'owner';
  void index;

  useEffect(() => {
    if (!revealed) return;
    const timer = window.setTimeout(() => setRevealed(false), 15000);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  const menu = (
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
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-textMuted">
      {locked ? (
        <span className="inline-flex items-center gap-1">
          <LockKeyhole className="h-3 w-3" />
          Locked
        </span>
      ) : null}
      {dualApproval ? (
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3" />
          Two-person
        </span>
      ) : null}
      {nomineeAccess ? (
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          {ownerLabel ? `Nominee · ${truncate(ownerLabel, 16)}` : 'Nominee'}
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1">
        <FileText className="h-3 w-3" />
        {attachmentCount}
      </span>
      <span>·</span>
      <span>{formatRelativeTime(entry.updatedAt || entry.createdAt)}</span>
    </div>
  );

  if (view === 'list') {
    return (
      <article
        role="article"
        aria-label={`${entry.title} entry`}
        onClick={() => onView(entry._id)}
        className="group flex cursor-pointer items-center gap-3 rounded-md border border-line bg-panel px-3 py-2.5 transition-colors duration-150 ease-out hover:border-textPrimary/25 hover:bg-surface"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-muted text-textMuted">
          <CategoryIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-[15px] font-semibold text-textPrimary">{entry.title}</h3>
            <span className="truncate text-xs text-textMuted">{entry.category || 'General'}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-textMuted">{subtitle || 'No details'}</p>
        </div>
        <div className="hidden sm:block">{meta}</div>
        {menu}
      </article>
    );
  }

  return (
    <article
      role="article"
      aria-label={`${entry.title} entry`}
      onClick={() => onView(entry._id)}
      className="group flex cursor-pointer flex-col rounded-lg border border-line bg-panel transition-colors duration-150 ease-out hover:border-textPrimary/25"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-surface-muted text-textMuted transition-colors group-hover:border-textPrimary/25 group-hover:text-textPrimary">
          <CategoryIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-textMuted">
              {entry.category || 'General'}
            </p>
          </div>
          <h3 className="mt-0.5 truncate font-heading text-lg font-semibold text-textPrimary">{entry.title}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-textMuted">{subtitle || 'No details'}</p>
        </div>
        {menu}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
        {meta}
        {showPasswordRow ? (
          <div className="flex items-center gap-1">
            <span className="truncate font-mono text-xs text-textPrimary">
              {maskValue(entry.password || '', revealed)}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setRevealed((value) => !value);
              }}
              className="focus-ring rounded-full p-1 text-textMuted hover:text-textPrimary"
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
      </div>
    </article>
  );
}
