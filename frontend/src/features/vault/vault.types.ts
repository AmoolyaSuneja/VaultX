export type VaultSort = 'newest' | 'oldest' | 'az' | 'za';

export interface VaultAccessPolicy {
  role: 'owner' | 'approver' | 'nominee' | 'viewer';
  requiresDualApproval: boolean;
  secondApprover?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  owner?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  approvalTarget?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  requestedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  requestedByCurrentUser: boolean;
  approvalStatus: 'not_required' | 'awaiting_request' | 'pending' | 'approved' | 'expired';
  requestedAt?: string | null;
  approvedAt?: string | null;
  approvalExpiresAt?: string | null;
  canRequestApproval: boolean;
  canApprove: boolean;
  actionRequest?: {
    action: 'download' | 'share' | null;
    attachmentIndex: number | null;
    requestedByCurrentUser: boolean;
    approvedAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
  } | null;
}

export interface VaultFile {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface VaultEntry {
  _id: string;
  title: string;
  category: string;
  url?: string;
  username?: string;
  password?: string;
  notes?: string;
  data?: string;
  tags?: string[];
  filePath?: string[];
  attachmentCount?: number;
  unlockAt?: string;
  createdAt?: string;
  updatedAt?: string;
  requiresDualApproval?: boolean;
  secondApproverEmail?: string;
  accessPolicy?: VaultAccessPolicy;
}

export interface EntryPayload {
  title: string;
  category: string;
  url?: string;
  username?: string;
  password?: string;
  notes?: string;
  data?: string;
  tags?: string[];
  files?: File[];
  unlockAt?: string;
  requiresDualApproval?: boolean;
  secondApproverEmail?: string;
}

export interface VaultStats {
  totalEntries: number;
  categories: number;
  filesAttached: number;
  lastUpdated?: string;
}
