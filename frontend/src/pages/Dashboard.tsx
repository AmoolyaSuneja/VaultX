import { Listbox } from '@headlessui/react';
import { Check, ChevronDown, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, GridSkeleton } from '@/components/ui';
import { EntryForm } from '@/components/forms/EntryForm';
import { StatsStrip } from '@/components/vault/StatsStrip';
import { VaultGrid } from '@/components/vault/VaultGrid';
import { useDebouncedValue } from '@/lib/hooks';
import { defaultCategories, sortOptions } from '@/lib/constants';
import { useAuthStore } from '@/features/auth/auth.store';
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayLabel() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());
}

export function DashboardPage({ createOpen = false }: DashboardPageProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const entriesQuery = useVaultEntries();
  const createMutation = useCreateEntry();
  const deleteMutation = useDeleteEntry();
  const [editingEntry, setEditingEntry] = useState<VaultEntry | undefined>();
  const [localSearch, setLocalSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    return (window.localStorage.getItem('vaultx-view') as 'grid' | 'list') || 'grid';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('vaultx-view', view);
  }, [view]);

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
  const isInitialLoading = entriesQuery.isLoading && !entriesQuery.data;
  const filterActive = Boolean(search || selectedCategories.length);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-label text-textMuted tabular">{getTodayLabel()}</p>
          <h1 className="mt-2 font-heading text-[40px] font-semibold leading-[1.05] tracking-tight text-textPrimary sm:text-[44px]">
            {getGreeting()}, {firstName}.
          </h1>
          <p className="mt-2 text-sm leading-6 text-textMuted">
            {stats.totalEntries === 0
              ? 'Start by saving your first credential, note, or document.'
              : `You have ${stats.totalEntries} ${stats.totalEntries === 1 ? 'entry' : 'entries'} in your vault.`}
          </p>
        </div>
        <Button onClick={() => navigate('/vault/new')} className="w-full justify-center sm:w-auto">
          <Plus className="h-4 w-4" />
          New entry
        </Button>
      </header>

      <StatsStrip stats={stats} />

      <section className="rounded-lg border border-line bg-panel p-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 transition-colors duration-180 focus-within:border-textPrimary/60">
            <Search className="h-4 w-4 text-textMuted" />
            <input
              id="vault-search"
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder="Search titles, usernames, notes, URLs"
              className="min-w-0 flex-1 bg-transparent text-sm text-textPrimary outline-none placeholder:text-textMuted/60"
            />
            <kbd className="hidden rounded border border-line bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-textMuted tabular md:inline">
              ⌘K
            </kbd>
          </label>

          <div className="flex items-center gap-2">
            <Listbox value={selectedCategories} onChange={setSelectedCategories} multiple>
              <div className="relative">
                <Listbox.Button className="focus-ring press flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-textPrimary transition-colors duration-180 hover:bg-surface-muted">
                  Category
                  {selectedCategories.length ? (
                    <span className="rounded-full bg-brand/10 px-1.5 text-[11px] font-medium text-textPrimary tabular">
                      {selectedCategories.length}
                    </span>
                  ) : null}
                  <ChevronDown className="h-4 w-4 text-textMuted" />
                </Listbox.Button>
                <Listbox.Options className="absolute right-0 z-40 mt-2 max-h-72 w-[min(18rem,calc(100vw-2rem))] overflow-auto rounded-md border border-line bg-panel p-1 shadow-card animate-fadeIn scrollbar-thin">
                  {categories.map((category) => {
                    const selected = selectedCategories.includes(category);
                    return (
                      <Listbox.Option
                        key={category}
                        value={category}
                        as="button"
                        className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-textPrimary transition-colors duration-150 hover:bg-surface-muted"
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
                <Listbox.Button className="focus-ring press flex min-h-10 items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-textPrimary transition-colors duration-180 hover:bg-surface-muted">
                  {sortOptions.find((option) => option.value === sort)?.label}
                  <ChevronDown className="h-4 w-4 text-textMuted" />
                </Listbox.Button>
                <Listbox.Options className="absolute right-0 z-40 mt-2 w-40 rounded-md border border-line bg-panel p-1 shadow-card animate-fadeIn">
                  {sortOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer rounded px-3 py-2 text-sm text-textPrimary transition-colors duration-150 hover:bg-surface-muted"
                    >
                      {option.label}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>

            <div
              role="group"
              aria-label="Change view"
              className="flex items-center rounded-md border border-line bg-surface p-0.5"
            >
              <button
                type="button"
                onClick={() => setView('grid')}
                aria-pressed={view === 'grid'}
                className={`focus-ring press flex h-9 w-9 items-center justify-center rounded transition-colors duration-180 ${view === 'grid' ? 'bg-surface-muted text-textPrimary' : 'text-textMuted hover:text-textPrimary'}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                aria-pressed={view === 'list'}
                className={`focus-ring press flex h-9 w-9 items-center justify-center rounded transition-colors duration-180 ${view === 'list' ? 'bg-surface-muted text-textPrimary' : 'text-textMuted hover:text-textPrimary'}`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {isInitialLoading ? (
        <GridSkeleton count={6} />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          title={filterActive ? 'Nothing matches' : 'Your vault is empty'}
          copy={
            filterActive
              ? 'No entries match your search and category filters.'
              : 'Create your first entry to save credentials, notes, and files.'
          }
          actionLabel={filterActive ? 'New entry' : 'Create first entry'}
          onAction={() => navigate('/vault/new')}
          secondaryLabel={filterActive ? 'Clear filters' : undefined}
          onSecondaryAction={clearFilters}
        />
      ) : (
        <VaultGrid
          entries={filteredEntries}
          view={view}
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
