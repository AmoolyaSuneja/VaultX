import { Listbox } from '@headlessui/react';
import { Check, ChevronDown, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState } from '@/components/ui';
import { EntryForm } from '@/components/forms/EntryForm';
import { StatsStrip } from '@/components/vault/StatsStrip';
import { VaultGrid } from '@/components/vault/VaultGrid';
import { useDebouncedValue } from '@/lib/hooks';
import { defaultCategories, sortOptions } from '@/lib/constants';
import {
  useCreateEntry,
  useDeleteEntry,
  useFilteredEntries,
  useUpdateEntry,
  useVaultEntries,
  getVaultStats
} from '@/features/vault/useVault';
import { useVaultStore } from '@/features/vault/vault.store';
import type { VaultEntry } from '@/features/vault/vault.types';

interface DashboardPageProps {
  createOpen?: boolean;
}

export function DashboardPage({ createOpen = false }: DashboardPageProps) {
  const navigate = useNavigate();
  const entriesQuery = useVaultEntries();
  const createMutation = useCreateEntry();
  const deleteMutation = useDeleteEntry();
  const [editingEntry, setEditingEntry] = useState<VaultEntry | undefined>();
  const [localSearch, setLocalSearch] = useState('');

  const search = useVaultStore((state) => state.search);
  const setSearch = useVaultStore((state) => state.setSearch);
  const selectedCategories = useVaultStore((state) => state.selectedCategories);
  const setSelectedCategories = useVaultStore((state) => state.setSelectedCategories);
  const clearFilters = useVaultStore((state) => state.clearFilters);
  const sort = useVaultStore((state) => state.sort);
  const setSort = useVaultStore((state) => state.setSort);

  const debounced = useDebouncedValue(localSearch, 300);
  const filteredEntries = useFilteredEntries(entriesQuery.data);
  const stats = getVaultStats(entriesQuery.data);
  const categories = useMemo(
    () =>
      Array.from(
        new Set([...(entriesQuery.data?.map((entry) => entry.category) ?? []), ...defaultCategories].filter(Boolean))
      ),
    [entriesQuery.data]
  );

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    setSearch(debounced);
  }, [debounced, setSearch]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('vault-search')?.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const updateMutation = useUpdateEntry(editingEntry?._id ?? '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-textMuted">Vault</p>
          <h1 className="mt-1 font-heading text-3xl text-textPrimary sm:text-[34px]">Your entries</h1>
        </div>
        <Button onClick={() => navigate('/vault/new')} className="w-full justify-center sm:w-auto">
          <Plus className="h-4 w-4" />
          New entry
        </Button>
      </div>

      <StatsStrip stats={stats} />

      <div className="rounded-lg border border-line bg-panel p-2 sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 transition-colors focus-within:border-textPrimary/60">
            <Search className="h-4 w-4 text-textMuted" />
            <input
              id="vault-search"
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder="Search titles, usernames, notes, URLs"
              className="min-w-0 flex-1 bg-transparent text-sm text-textPrimary outline-none placeholder:text-textMuted/70"
            />
            <kbd className="hidden rounded border border-line bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-textMuted md:inline">
              ⌘K
            </kbd>
          </label>

          <div className="flex items-center gap-2">
            <Listbox value={selectedCategories} onChange={setSelectedCategories} multiple>
              <div className="relative">
                <Listbox.Button className="focus-ring flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-textPrimary transition-colors hover:bg-surface-muted">
                  Category
                  {selectedCategories.length ? (
                    <span className="rounded-full bg-brand/10 px-1.5 text-[11px] font-medium text-textPrimary">
                      {selectedCategories.length}
                    </span>
                  ) : null}
                  <ChevronDown className="h-4 w-4 text-textMuted" />
                </Listbox.Button>
                <Listbox.Options className="absolute right-0 z-40 mt-2 max-h-72 w-[min(18rem,calc(100vw-2rem))] overflow-auto rounded-md border border-line bg-panel p-1 shadow-card">
                  {categories.map((category) => {
                    const selected = selectedCategories.includes(category);
                    return (
                      <Listbox.Option
                        key={category}
                        value={category}
                        as="button"
                        className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-textPrimary transition-colors hover:bg-surface-muted"
                      >
                        <span>{category}</span>
                        {selected ? <Check className="h-4 w-4 text-textPrimary" /> : null}
                      </Listbox.Option>
                    );
                  })}
                </Listbox.Options>
              </div>
            </Listbox>

            <Listbox value={sort} onChange={setSort}>
              <div className="relative">
                <Listbox.Button className="focus-ring flex min-h-10 items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-textPrimary transition-colors hover:bg-surface-muted">
                  {sortOptions.find((option) => option.value === sort)?.label}
                  <ChevronDown className="h-4 w-4 text-textMuted" />
                </Listbox.Button>
                <Listbox.Options className="absolute right-0 z-40 mt-2 w-40 rounded-md border border-line bg-panel p-1 shadow-card">
                  {sortOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer rounded px-3 py-2 text-sm text-textPrimary transition-colors hover:bg-surface-muted"
                    >
                      {option.label}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <EmptyState
          title={search || selectedCategories.length ? 'Nothing matches' : 'Your vault is empty'}
          copy={
            search || selectedCategories.length
              ? 'No entries match your search and category filters.'
              : 'Create your first entry to save credentials, notes, and files.'
          }
          actionLabel={search || selectedCategories.length ? 'New entry' : 'Create first entry'}
          onAction={() => navigate('/vault/new')}
          secondaryLabel={search || selectedCategories.length ? 'Clear filters' : undefined}
          onSecondaryAction={clearFilters}
        />
      ) : (
        <VaultGrid
          entries={filteredEntries}
          onView={(id) => navigate(`/vault/${id}`)}
          onEdit={(entry) => setEditingEntry(entry)}
          onDelete={(entry) => deleteMutation.mutate(entry._id)}
        />
      )}

      <EntryForm
        open={createOpen}
        mode="create"
        onClose={() => navigate('/vault')}
        onSubmit={async (payload) => {
          await createMutation.mutateAsync(payload);
        }}
      />

      <EntryForm
        open={Boolean(editingEntry)}
        mode="edit"
        entry={editingEntry}
        onClose={() => setEditingEntry(undefined)}
        onSubmit={async (payload) => {
          if (!editingEntry?._id) return;
          await updateMutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
