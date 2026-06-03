import {
  AlertTriangle,
  Copy,
  Download,
  ExternalLink,
  FileImage,
  FileText,
  LockKeyhole,
  Pencil,
  Share2,
  ShieldCheck
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { EntryForm } from '@/components/forms/EntryForm';
import { Badge, Button, Card, Input, Modal } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth.store';
import { ApiError, authHeaders } from '@/features/vault/vault.service';
import { useCreateShareLink, useRequestEntryApproval, useVaultEntry, useUpdateEntry } from '@/features/vault/useVault';
import {
  copyToClipboard,
  downloadProtectedResource,
  formatDateTime,
  fetchProtectedResourceBlobUrl,
  getAttachmentKind,
  getAttachmentKindFromContentType,
  isUnlockPending,
  type AttachmentKind
} from '@/lib/utils';

export function EntryDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const entryQuery = useVaultEntry(id);
  const updateMutation = useUpdateEntry(id);
  const createShareLinkMutation = useCreateShareLink(id);
  const requestApprovalMutation = useRequestEntryApproval(id);
  const [editing, setEditing] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [shareTarget, setShareTarget] = useState<{ filePath: string; label: string } | null>(null);
  const [sharePassword, setSharePassword] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const entry = entryQuery.data;
  const queryError = entryQuery.error;
  const errorMessage = queryError instanceof Error ? queryError.message : '';
  const locked = isUnlockPending(entry?.unlockAt);
  const lockedError = queryError instanceof ApiError && queryError.status === 403;
  const accessPolicy = entry?.accessPolicy;
  const canSeeSensitive = Boolean(
    entry?.notes || entry?.data || entry?.filePath?.length
  );
  const ownerView = accessPolicy?.role === 'owner';
  const nomineeAccess = accessPolicy?.role === 'nominee';
  const ownerLabel = accessPolicy?.owner?.name || accessPolicy?.owner?.email;
  const attachmentCount = entry?.attachmentCount ?? entry?.filePath?.length ?? 0;
  const approvalContact =
    accessPolicy?.approvalStatus === 'pending' && !accessPolicy.requestedByCurrentUser
      ? accessPolicy.requestedBy
      : accessPolicy?.approvalTarget || accessPolicy?.secondApprover || accessPolicy?.owner;
  const approvalContactLabel =
    accessPolicy?.approvalStatus === 'pending'
      ? accessPolicy.requestedByCurrentUser
        ? 'Sent to'
        : 'Requested by'
      : accessPolicy?.role === 'owner'
        ? 'Second approver'
        : 'Approval partner';

  if (entryQuery.isLoading && !entry) {
    return (
      <Card>
        <p className="text-sm text-textMuted">Loading entry...</p>
      </Card>
    );
  }

  if (!entry && queryError) {
    return (
      <div className="space-y-4">
        <Card className="border-danger/20 bg-danger-light/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />
            <div>
              <h1 className="font-heading text-2xl text-textPrimary">
                {lockedError ? 'Entry is locked' : 'Unable to load this entry'}
              </h1>
              <p className="mt-1 text-sm leading-6 text-textMuted">{errorMessage || 'Please try again in a moment.'}</p>
            </div>
          </div>
        </Card>
        <Button variant="ghost" onClick={() => navigate('/vault')}>
          Back to vault
        </Button>
      </div>
    );
  }

  if (!entry) return null;

  if (locked) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{entry.category || 'General'}</Badge>
              {nomineeAccess ? (
                <Badge variant="status" statusTone="archived" className="gap-1.5">
                  <ShieldCheck className="h-3 w-3" />
                  {ownerLabel ? `Nominee: ${ownerLabel}` : 'Nominee'}
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-3 break-words font-heading text-3xl text-textPrimary sm:text-[34px]">{entry.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-textMuted">
              Time-locked. Sensitive content and attachments will unlock automatically at the scheduled time.
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/vault')}>
            Back
          </Button>
        </div>

        <Card>
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 text-textMuted" />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Scheduled unlock</p>
              <h2 className="mt-1 font-heading text-xl text-textPrimary">{formatDateTime(entry.unlockAt)}</h2>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Card className="space-y-4">
            <DetailRow label="Status" value="Locked" />
            <DetailRow label="Content" value="Sensitive fields are hidden until the unlock time passes." multiline />
          </Card>

          <Card>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Metadata</p>
            <div className="mt-4 grid gap-3">
              <MetaItem label="Created" value={formatDateTime(entry.createdAt)} />
              <MetaItem label="Updated" value={formatDateTime(entry.updatedAt)} />
              <MetaItem label="Unlocks" value={formatDateTime(entry.unlockAt)} />
              <MetaItem label="Attachments" value={`${attachmentCount} files`} />
              <MetaItem label="Tags" value={entry.tags?.join(', ') || 'None'} />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{entry.category || 'General'}</Badge>
            {nomineeAccess ? (
              <Badge variant="status" statusTone="archived" className="gap-1.5">
                <ShieldCheck className="h-3 w-3" />
                {ownerLabel ? `Nominee: ${ownerLabel}` : 'Nominee'}
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-3 break-words font-heading text-3xl text-textPrimary sm:text-[34px]">{entry.title}</h1>
          {entry.notes || entry.data ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-textMuted">{entry.notes || entry.data}</p>
          ) : null}
        </div>
        <Button variant="ghost" onClick={() => navigate('/vault')} className="w-full sm:w-auto">
          Back
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="space-y-4">
          {accessPolicy?.requiresDualApproval ? (
            <div className="rounded-md border border-line bg-surface p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Two-person access</p>
              <h2 className="mt-1 font-heading text-xl text-textPrimary">
                {accessPolicy.approvalStatus === 'approved' ? 'Approved access is active' : 'Participant approval required'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-textMuted">
                {accessPolicy.approvalStatus === 'approved'
                  ? `Sensitive content stays open until ${formatDateTime(accessPolicy.approvalExpiresAt)}.`
                  : accessPolicy.approvalStatus === 'pending'
                    ? accessPolicy.requestedByCurrentUser
                      ? `Waiting for ${accessPolicy.approvalTarget?.email || 'the other participant'} to approve.`
                      : `${accessPolicy.requestedBy?.email || 'The other participant'} requested access.`
                    : 'Either participant must request access, and the other must approve via email before sensitive content is available.'}
              </p>
              {approvalContact?.email ? (
                <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">
                  {approvalContactLabel}: <span className="normal-case tracking-normal text-textPrimary">{approvalContact.email}</span>
                </p>
              ) : null}
              {accessPolicy.canRequestApproval && accessPolicy.approvalStatus !== 'approved' ? (
                <div className="mt-3">
                  <Button
                    type="button"
                    loading={requestApprovalMutation.isPending}
                    onClick={async () => {
                      await requestApprovalMutation.mutateAsync();
                      await entryQuery.refetch();
                    }}
                  >
                    {accessPolicy.approvalStatus === 'pending' && accessPolicy.requestedByCurrentUser
                      ? 'Resend request'
                      : 'Request approval'}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          <DetailRow label="Notes" value={entry.notes || entry.data} multiline />
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Metadata</p>
            <div className="mt-4 grid gap-3">
              <MetaItem label="Created" value={formatDateTime(entry.createdAt)} />
              <MetaItem label="Updated" value={formatDateTime(entry.updatedAt)} />
              <MetaItem label="Unlocks" value={formatDateTime(entry.unlockAt)} />
              <MetaItem label="Attachments" value={`${attachmentCount} files`} />
              <MetaItem label="Tags" value={entry.tags?.join(', ') || 'None'} />
            </div>
          </Card>

          <Card>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Attachments</p>
            <div className="mt-4 grid gap-2">
              {canSeeSensitive && entry.filePath?.length ? (
                entry.filePath.map((fileUrl, index) => (
                  <AttachmentCard
                    key={`${fileUrl}-${index}-${entry.updatedAt ?? entry.createdAt ?? ''}`}
                    entryId={entry._id}
                    fileUrl={fileUrl}
                    index={index}
                    downloading={downloadingIndex === index}
                    requiresDualApproval={Boolean(accessPolicy?.requiresDualApproval)}
                    onDownloadStateChange={(active) => setDownloadingIndex(active ? index : null)}
                    onShare={() => {
                      setShareTarget({ filePath: fileUrl, label: `Attachment ${index + 1}` });
                      setSharePassword('');
                      setGeneratedLink('');
                    }}
                  />
                ))
              ) : attachmentCount ? (
                <p className="text-sm text-textMuted">
                  Attachments are protected until the other participant approves access.
                </p>
              ) : (
                <p className="text-sm text-textMuted">No files attached to this entry.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {ownerView ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="focus-ring fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-3 z-40 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-background shadow-card transition-colors hover:bg-brand-deep sm:right-6 lg:bottom-8"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      ) : null}

      {ownerView ? (
        <EntryForm
          open={editing}
          mode="edit"
          entry={entry}
          onClose={() => setEditing(false)}
          onSubmit={async (payload) => {
            await updateMutation.mutateAsync(payload);
          }}
        />
      ) : null}

      <Modal
        open={Boolean(shareTarget)}
        onClose={() => {
          setShareTarget(null);
          setSharePassword('');
          setGeneratedLink('');
        }}
      >
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Protected share link</p>
            <h3 className="mt-1 font-heading text-xl text-textPrimary">{shareTarget?.label}</h3>
            <p className="mt-1 text-sm text-textMuted">
              Create a protected link for this document only. The recipient will need the password.
            </p>
          </div>

          <Input
            label="Link password"
            type="password"
            value={sharePassword}
            onChange={(event) => setSharePassword(event.target.value)}
            placeholder="Minimum 4 characters"
          />

          {generatedLink ? (
            <Input
              label="Generated link"
              value={generatedLink}
              readOnly
              rightAdornment={
                <button
                  type="button"
                  className="focus-ring rounded-full p-1 text-textMuted transition-colors hover:text-textPrimary"
                  aria-label="Copy share link"
                  onClick={async () => {
                    if (await copyToClipboard(generatedLink)) toast.success('Share link copied');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </button>
              }
            />
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            {generatedLink ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.open(generatedLink, '_blank', 'noopener,noreferrer')}
              >
                Open link
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShareTarget(null);
                setSharePassword('');
                setGeneratedLink('');
              }}
            >
              Close
            </Button>
            <Button
              type="button"
              loading={createShareLinkMutation.isPending}
              onClick={async () => {
                if (!shareTarget) return;
                try {
                  const payload = await createShareLinkMutation.mutateAsync({
                    filePath: shareTarget.filePath,
                    password: sharePassword
                  });
                  setGeneratedLink(payload.data.link);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Unable to create share link');
                }
              }}
            >
              Generate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="focus-ring rounded-full p-1.5 text-textMuted transition-colors hover:bg-surface-muted hover:text-textPrimary"
    >
      {children}
    </button>
  );
}

function DetailRow({
  label,
  value,
  action,
  multiline = false,
  mono = false
}: {
  label: string;
  value?: string;
  action?: ReactNode;
  multiline?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="border-b border-line pb-4 last:border-none last:pb-0">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">{label}</p>
        {action}
      </div>
      <div
        className={
          multiline
            ? 'mt-2 whitespace-pre-wrap break-words rounded-md border border-line bg-surface p-3 text-sm leading-6 text-textPrimary'
            : `mt-1.5 break-words text-base ${mono ? 'font-mono' : 'font-medium'} text-textPrimary`
        }
      >
        {value || 'Not provided'}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-textPrimary">{value}</p>
    </div>
  );
}

function AttachmentCard({
  entryId,
  fileUrl,
  index,
  downloading,
  requiresDualApproval,
  onDownloadStateChange,
  onShare
}: {
  entryId: string;
  fileUrl: string;
  index: number;
  downloading: boolean;
  requiresDualApproval: boolean;
  onDownloadStateChange: (active: boolean) => void;
  onShare: () => void;
}) {
  const token = useAuthStore((state) => state.token);
  const [kind, setKind] = useState<AttachmentKind>(() => getAttachmentKind(fileUrl));
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const label = `Attachment ${index + 1}`;
  const image = kind === 'image';
  const pdf = kind === 'pdf';
  const downloadLabel = pdf ? 'Download PDF' : image ? 'Download image' : 'Download file';
  const previewEndpoint = `/api/vault/${entryId}/attachments/${index}/preview`;

  async function loadPreview() {
    if (!token) throw new Error('Please log in again.');

    setPreviewLoading(true);
    try {
      const { contentType, objectUrl } = await fetchProtectedResourceBlobUrl(previewEndpoint, {
        headers: authHeaders(token)
      });
      const resolvedKind = getAttachmentKindFromContentType(contentType) || getAttachmentKind(fileUrl);

      setKind(resolvedKind);
      if (resolvedKind === 'file') {
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return '';
        });
      } else {
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return objectUrl;
        });
      }

      return { objectUrl, kind: resolvedKind };
    } finally {
      setPreviewLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return '';
      });
      return;
    }

    let active = true;
    let loadedObjectUrl = '';

    loadPreview()
      .then(({ objectUrl, kind: resolvedKind }) => {
        if (!active) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        loadedObjectUrl = objectUrl;
        if (resolvedKind === 'file') URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        if (!active) return;
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return '';
        });
      });

    return () => {
      active = false;
      if (loadedObjectUrl) URL.revokeObjectURL(loadedObjectUrl);
    };
  }, [fileUrl, previewEndpoint, token]);

  return (
    <div className="rounded-md border border-line bg-surface p-3 transition-colors hover:bg-surface-muted">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-textMuted">
          {image ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-textPrimary">{label}</p>
          <p className="text-xs text-textMuted">{image ? 'Image' : pdf ? 'PDF document' : 'Attachment'}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-0.5">
          <IconButton
            label={`Open ${label}`}
            onClick={async () => {
              let previewWindow: Window | null = null;
              try {
                if (previewUrl) {
                  window.open(previewUrl, '_blank', 'noopener,noreferrer');
                  return;
                }
                previewWindow = window.open('', '_blank', 'noopener,noreferrer');
                const loaded = await loadPreview();
                if (loaded.kind === 'file') {
                  previewWindow?.close();
                  await downloadProtectedResource(
                    `/api/vault/${entryId}/attachments/${index}/download`,
                    label.toLowerCase().replace(/\s+/g, '-'),
                    { headers: authHeaders(token) }
                  );
                  toast.success(`${downloadLabel} ready`);
                  return;
                }
                if (previewWindow) previewWindow.location.href = loaded.objectUrl;
                else window.open(loaded.objectUrl, '_blank', 'noopener,noreferrer');
              } catch (error) {
                previewWindow?.close();
                toast.error(error instanceof Error ? error.message : 'Unable to open attachment');
              }
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </IconButton>
          {!requiresDualApproval ? (
            <IconButton label={`Share ${label}`} onClick={onShare}>
              <Share2 className="h-4 w-4" />
            </IconButton>
          ) : null}
          {!requiresDualApproval ? (
            <button
              type="button"
              disabled={downloading}
              aria-label={`${downloadLabel} for ${label}`}
              onClick={async () => {
                try {
                  onDownloadStateChange(true);
                  await downloadProtectedResource(
                    `/api/vault/${entryId}/attachments/${index}/download`,
                    label.toLowerCase().replace(/\s+/g, '-'),
                    { headers: authHeaders(token) }
                  );
                  toast.success(`${downloadLabel} ready`);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Download failed');
                } finally {
                  onDownloadStateChange(false);
                }
              }}
              className="focus-ring rounded-full p-1.5 text-textMuted transition-colors hover:bg-surface-muted hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {image && previewUrl ? (
        <img src={previewUrl} alt={label} className="mt-3 h-32 w-full rounded-md border border-line object-cover" />
      ) : null}

      {pdf && previewUrl ? (
        <div className="mt-3 overflow-hidden rounded-md border border-line">
          <iframe src={previewUrl} title={`${label} preview`} className="h-52 w-full sm:h-72" />
        </div>
      ) : null}

      {previewLoading ? <p className="mt-2 text-xs text-textMuted">Loading preview...</p> : null}
    </div>
  );
}
