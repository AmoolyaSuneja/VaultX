import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Ellipsis, Eye, FileText, LockKeyhole, Pencil, ShieldCheck, Trash2, Users } from 'lucide-react';
import { formatRelativeTime, isUnlockPending, truncate } from '@/lib/utils';
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
  const locked = isUnlockPending(entry.unlockAt);
  const role = entry.accessPolicy?.role || 'owner';
  const dualApproval = entry.accessPolicy?.requiresDualApproval;
  const nomineeAccess = role === 'nominee';
  const ownerLabel = entry.accessPolicy?.owner?.name || entry.accessPolicy?.owner?.email;
  const CategoryIcon = getCategoryIcon(entry.category);
  const subtitle = entry.notes || entry.data ? truncate(entry.notes || entry.data || '', 72) : '';
  const attachmentCount = entry.attachmentCount ?? entry.filePath?.length ?? 0;
  const animationDelay = Math.min(index * 24, 160);

  const menu = (
    <Menu as="div" className="relative">
      <MenuButton
        onClick={(event) => event.stopPropagation()}
        className="focus-ring press rounded-full p-1.5 text-textMuted hover:bg-surface-muted hover:text-textPrimary"
        aria-label="Entry actions"
      >
        <Ellipsis className="h-4 w-4" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-[70] mt-2 min-w-[180px] rounded-md border border-line bg-panel p-1 shadow-card animate-fadeIn"
      >
        <MenuItem>
          {({ focus }) => (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onView(entry._id);
              }}
              className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors duration-150 ${focus ? 'bg-surface-muted text-textPrimary' : 'text-textPrimary'}`}
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
                className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors duration-150 ${focus ? 'bg-surface-muted text-textPrimary' : 'text-textPrimary'}`}
              >
                <Pencil className="h-4 w-4" />
                Edit
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
                  className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-danger transition-colors duration-150 ${focus ? 'bg-danger-light/30' : ''}`}
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-textMuted tabular">
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
      <span className="opacity-60">·</span>
      <span>{formatRelativeTime(entry.updatedAt || entry.createdAt)}</span>
    </div>
  );

  if (view === 'list') {
    return (
      <article
        role="article"
        aria-label={`${entry.title} entry`}
        onClick={() => onView(entry._id)}
        style={{ animationDelay: `${animationDelay}ms` }}
        className="group animate-fadeIn press-card flex cursor-pointer items-center gap-3 rounded-md border border-line bg-panel px-3 py-2.5 hover:border-textPrimary/25 hover:bg-surface"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-surface-muted text-textMuted">
          <CategoryIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-[16px] font-semibold leading-tight text-textPrimary">{entry.title}</h3>
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
      style={{ animationDelay: `${animationDelay}ms` }}
      className="group animate-fadeIn press-card flex cursor-pointer flex-col rounded-lg border border-line bg-panel hover:border-textPrimary/25 hover:shadow-card"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-surface-muted text-textMuted transition-colors duration-200 ease-smooth group-hover:border-textPrimary/25 group-hover:text-textPrimary">
          <CategoryIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10.5px] font-medium uppercase tracking-label text-textMuted">
            {entry.category || 'General'}
          </p>
          <h3 className="mt-0.5 truncate font-heading text-[17px] font-semibold leading-[1.2] text-textPrimary">
            {entry.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-textMuted">{subtitle || 'No details'}</p>
        </div>
        {menu}
      </div>

      <div className="flex items-center gap-3 border-t border-line px-4 py-2.5">
        {meta}
      </div>
    </article>
  );
}
