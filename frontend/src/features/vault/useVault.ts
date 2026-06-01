import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  createShareLink,
  createVaultEntry,
  deleteVaultEntry,
  getVaultEntries,
  getVaultEntry,
  requestEntryApproval,
  updateVaultEntry
} from './vault.service';
import { useVaultStore } from './vault.store';
import type { EntryPayload, VaultEntry, VaultStats } from './vault.types';

const ENTRIES_KEY = ['vault', 'entries'] as const;

function entryKey(id: string) {
  return ['vault', 'entry', id] as const;
}

function upsertEntry(queryClient: QueryClient, entry: VaultEntry) {
  queryClient.setQueryData<VaultEntry[]>(ENTRIES_KEY, (existing) => {
    if (!existing) return [entry];
    const index = existing.findIndex((item) => item._id === entry._id);
    if (index === -1) return [entry, ...existing];
    const next = existing.slice();
    next[index] = entry;
    return next;
  });

  queryClient.setQueryData(entryKey(entry._id), entry);
}

function removeEntry(queryClient: QueryClient, id: string) {
  queryClient.setQueryData<VaultEntry[]>(ENTRIES_KEY, (existing) => {
    if (!existing) return existing;
    return existing.filter((entry) => entry._id !== id);
  });
  queryClient.removeQueries({ queryKey: entryKey(id) });
}

async function refreshVaultQueries(queryClient: QueryClient, entryId?: string) {
  await queryClient.refetchQueries({ queryKey: ENTRIES_KEY });
  if (entryId) {
    await queryClient.refetchQueries({ queryKey: entryKey(entryId) });
  }
}

const vaultQueryDefaults = {
  refetchOnMount: 'always' as const,
  staleTime: 0
};

export function useVaultEntries() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ENTRIES_KEY,
    queryFn: () => getVaultEntries(token),
    enabled: Boolean(token),
    ...vaultQueryDefaults
  });
}

export function useVaultEntry(id?: string) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: id ? entryKey(id) : ['vault', 'entry', '__none__'],
    queryFn: () => getVaultEntry(token, id as string),
    enabled: Boolean(token && id),
    ...vaultQueryDefaults
  });
}

export function useCreateEntry() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EntryPayload) => createVaultEntry(token, payload),
    onSuccess: async (newEntry) => {
      upsertEntry(queryClient, newEntry);
      await refreshVaultQueries(queryClient, newEntry._id);
      toast.success('Vault entry saved');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to save vault entry';
      toast.error(message);
    }
  });
}

export function useCreateShareLink(id: string) {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (payload: { filePath: string; password: string }) => createShareLink(token, id, payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Share link created');
    }
  });
}

export function useRequestEntryApproval(id: string) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => requestEntryApproval(token, id),
    onSuccess: async (data) => {
      if (data.data) {
        upsertEntry(queryClient, data.data);
        await refreshVaultQueries(queryClient, data.data._id);
      }
      toast.success(data.message || 'Approval request sent');
    }
  });
}

export function useUpdateEntry(id: string) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EntryPayload) => updateVaultEntry(token, id, payload),
    onSuccess: async (updatedEntry) => {
      upsertEntry(queryClient, updatedEntry);
      await refreshVaultQueries(queryClient, updatedEntry._id);
      toast.success('Vault entry updated');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to update vault entry';
      toast.error(message);
    }
  });
}

export function useDeleteEntry() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteVaultEntry(token, id),
    onSuccess: async (_response, deletedId) => {
      removeEntry(queryClient, deletedId);
      await refreshVaultQueries(queryClient);
      toast.success('Vault entry deleted');
    }
  });
}

export function useFilteredEntries(entries: VaultEntry[] = []) {
  const search = useVaultStore((state) => state.search);
  const selectedCategories = useVaultStore((state) => state.selectedCategories);
  const sort = useVaultStore((state) => state.sort);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...entries]
      .filter((entry) => {
        const categoryMatch =
          selectedCategories.length === 0 || selectedCategories.includes(entry.category || 'General');

        if (!categoryMatch) return false;
        if (!query) return true;

        const haystack = [entry.title, entry.category, entry.url, entry.username, entry.notes, entry.data]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((a, b) => {
        if (sort === 'oldest') {
          return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
        }
        if (sort === 'az') return a.title.localeCompare(b.title);
        if (sort === 'za') return b.title.localeCompare(a.title);
        return new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      });
  }, [entries, search, selectedCategories, sort]);

  return filtered;
}

export function getVaultStats(entries: VaultEntry[] = []): VaultStats {
  return {
    totalEntries: entries.length,
    categories: new Set(entries.map((entry) => entry.category || 'General')).size,
    filesAttached: entries.reduce((count, entry) => count + (entry.attachmentCount ?? entry.filePath?.length ?? 0), 0),
    lastUpdated: entries
      .map((entry) => entry.updatedAt || entry.createdAt)
      .filter(Boolean)
      .sort()
      .slice(-1)[0]
  };
}
