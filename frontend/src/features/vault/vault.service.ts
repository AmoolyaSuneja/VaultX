import type { EntryPayload, VaultEntry } from './vault.types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(path, init);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(payload.message || 'Request failed', response.status);
  }

  return payload as T;
}

export function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildFormData(payload: EntryPayload) {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('category', payload.category);
  formData.append('url', payload.url ?? '');
  formData.append('username', payload.username ?? '');
  formData.append('password', payload.password ?? '');
  formData.append('notes', payload.notes ?? '');
  formData.append('data', payload.data ?? payload.notes ?? '');
  formData.append('unlockAt', payload.unlockAt ? new Date(payload.unlockAt).toISOString() : '');
  formData.append('requiresDualApproval', payload.requiresDualApproval ? 'true' : 'false');
  formData.append('secondApproverEmail', payload.secondApproverEmail ?? '');
  (payload.tags ?? []).forEach((tag) => formData.append('tags', tag));
  (payload.files ?? []).forEach((file) => formData.append('files', file));
  return formData;
}

export async function getVaultEntries(token: string) {
  const payload = await request<{ data: VaultEntry[] }>('/api/vault', {
    headers: authHeaders(token)
  });
  return payload.data ?? [];
}

export async function getVaultEntry(token: string, id: string) {
  const payload = await request<{ data: VaultEntry }>(`/api/vault/${id}`, {
    headers: authHeaders(token)
  });
  return payload.data;
}

export async function createVaultEntry(token: string, data: EntryPayload) {
  const payload = await request<{ data: VaultEntry }>('/api/vault', {
    method: 'POST',
    headers: authHeaders(token),
    body: buildFormData(data)
  });
  return payload.data;
}

export async function updateVaultEntry(token: string, id: string, data: EntryPayload) {
  const payload = await request<{ data: VaultEntry }>(`/api/vault/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: buildFormData(data)
  });
  return payload.data;
}

export async function deleteVaultEntry(token: string, id: string) {
  await request(`/api/vault/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
}

export async function createShareLink(token: string, id: string, payload: { filePath: string; password: string }) {
  return request<{ data: { shareId: string; link: string }; message: string }>(`/api/vault/${id}/share-link`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export async function requestEntryApproval(token: string, id: string) {
  return request<{ data: VaultEntry; message: string }>(`/api/vault/${id}/request-approval`, {
    method: 'POST',
    headers: authHeaders(token)
  });
}

export async function approveEntryAccess(token: string, id: string) {
  return request<{ data: VaultEntry; message: string }>(`/api/vault/${id}/approve-access`, {
    method: 'POST',
    headers: authHeaders(token)
  });
}
