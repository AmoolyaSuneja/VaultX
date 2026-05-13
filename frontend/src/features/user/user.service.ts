import type { AuthUser } from '@/features/auth/auth.store';
import { requestJson } from '@/lib/request';

export async function uploadProfileAvatar(token: string, file: File) {
  const formData = new FormData();
  formData.append('document', file);

  const payload = await requestJson<{ data?: { fileUrl?: string } }>(
    '/api/upload',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    }
  );

  const uploadedUrl = payload.data?.fileUrl;

  if (typeof uploadedUrl !== 'string' || !uploadedUrl.trim()) {
    throw new Error('Upload completed but no avatar URL was returned');
  }

  return uploadedUrl;
}

export function updateProfile(token: string, payload: { name?: string; avatarUrl?: string }) {
  return requestJson<{ data: AuthUser; message?: string }>('/api/users/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}
