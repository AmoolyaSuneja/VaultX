import { requestJson } from '@/lib/request';

export type NomineeCondition = 'death' | 'incapacity' | 'inactivity' | 'courtOrder';
export type NomineeStatus = 'pending' | 'approved' | 'active' | 'revoked';

export interface NomineeRecord {
  user?: string | null;
  name: string;
  email: string;
  relationship: string;
  condition: NomineeCondition;
  status: NomineeStatus;
  requestedAt?: string | null;
  approvedAt?: string | null;
  activatedAt?: string | null;
  claim?: {
    submittedAt?: string | null;
    proofType?: string;
    proofNotes?: string;
    proofDocumentUrl?: string;
    proofDocumentName?: string;
    reviewedAt?: string | null;
    activationNotes?: string;
  } | null;
}

export interface NominationReference {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  nominee: NomineeRecord;
}

export interface NomineeStatusPayload {
  nominee: NomineeRecord | null;
  nominatedBy: NominationReference[];
}

export interface AdminNomineeClaim extends NominationReference {}

function jsonHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

export function getNomineeStatus(token: string) {
  return requestJson<{ data: NomineeStatusPayload }>('/api/nominee', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function registerNominee(
  token: string,
  payload: { name: string; email: string; relationship: string; condition: NomineeCondition }
) {
  return requestJson<{ data: NomineeRecord; message: string }>('/api/nominee', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function listNomineeClaims(token: string) {
  return requestJson<{ data: AdminNomineeClaim[] }>('/api/nominee/claims', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function claimNomineeAccess(
  token: string,
  payload: { ownerEmail: string; proofType: string; proofNotes: string; proofDocument: File | null }
) {
  const formData = new FormData();
  formData.append('ownerEmail', payload.ownerEmail);
  formData.append('proofType', payload.proofType);
  formData.append('proofNotes', payload.proofNotes);

  if (payload.proofDocument) {
    formData.append('proofDocument', payload.proofDocument);
  }

  return requestJson<{ data: NomineeRecord; message: string }>('/api/nominee/claim', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
}

export function approveNomineeClaim(token: string, payload: { ownerEmail?: string; ownerId?: string }) {
  return requestJson<{ data: NomineeRecord; message: string }>('/api/nominee/approve', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function activateNomineeAccess(
  token: string,
  payload: { ownerEmail?: string; ownerId?: string; verificationNotes: string }
) {
  return requestJson<{ data: NomineeRecord; message: string }>('/api/nominee/activate', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function revokeNominee(token: string) {
  return requestJson<{ data: NomineeRecord; message: string }>('/api/nominee/revoke', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
