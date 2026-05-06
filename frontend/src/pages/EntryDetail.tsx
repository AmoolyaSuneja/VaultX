import { AlertTriangle, Copy, Download, ExternalLink, Eye, EyeOff, FileImage, FileText, LockKeyhole, Pencil, Share2, ShieldCheck } from 'lucide-react';
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
  maskValue,
  normalizeUrl,
  type AttachmentKind
} from '@/lib/utils';

export function EntryDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const entryQuery = useVaultEntry(id);
  const updateMutation = useUpdateEntry(id);
  const createShareLinkMutation = useCreateShareLink(id);
  const requestApprovalMutation = useRequestEntryApproval(id);
  const [revealed, setRevealed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
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
  const canSeeSensitive = Boolean(entry?.password || entry?.notes || entry?.data || entry?.url || entry?.username || entry?.filePath?.length);
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
        ? 'Approval sent to'
        : 'Requested by'
      : accessPolicy?.role === 'owner'
        ? 'Second approver'
        : 'Approval partner';

  useEffect(() => {
    if (!revealed) {
      setSecondsLeft(30);
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setRevealed(false);
          return 30;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [revealed]);

  if (entryQuery.isLoading && !entry) {
    return (
      <Card className="rounded-xl">
        <p className="text-sm text-textMuted">Loading entry details...</p>
      </Card>
    );
  }

  if (!entry && queryError) {
    return (
      <div className="space-y-6">
        <Card className="rounded-xl border border-danger/20 bg-danger/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />
            <div className="space-y-2">
              <h1 className="font-heading text-2xl text-textPrimary">
                {lockedError ? 'Entry is locked' : 'Unable to load this entry'}
              </h1>
              <p className="text-sm leading-6 text-textMuted">
                {errorMessage || 'Please try again in a moment.'}
              </p>
            </div>
          </div>
        </Card>
        <Button variant="ghost" onClick={() => navigate('/vault')}>
          Back to vault
        </Button>
      </div>
    );
  }

  if (lockedError) {
    return (
      <div className="space-y-6">
        <Card className="rounded-xl border border-danger/20 bg-danger/5">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 text-danger" />
            <div className="space-y-2">
              <h1 className="font-heading text-2xl text-textPrimary">Entry is locked</h1>
              <p className="text-sm leading-6 text-textMuted">
                {errorMessage || 'This entry cannot be opened until its scheduled unlock time.'}
              </p>
            </div>
          </div>
        </Card>
        <Button variant="ghost" onClick={() => navigate('/vault')}>
          Back to vault
        </Button>
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  if (locked) {
    return (
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{entry.category || 'General'}</Badge>
              {nomineeAccess ? (
                <Badge variant="status" statusTone="archived" className="gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {ownerLabel ? `Nominee access: ${ownerLabel}` : 'Nominee access'}
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-3 break-words font-heading text-3xl text-textPrimary sm:mt-4 sm:text-4xl">{entry.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-textMuted">
              This entry is time-locked. Sensitive content and attachments will unlock automatically when the scheduled time arrives.
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/vault')}>
            Back to vault
          </Button>
        </div>

        <Card className="rounded-xl border border-brand/20 bg-brand-light/40">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 text-brand" />
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Scheduled unlock</p>
              <h2 className="font-heading text-2xl text-textPrimary">{formatDateTime(entry.unlockAt)}</h2>
              <p className="text-sm text-textMuted">
                {lockedError ? errorMessage : `Document is locked until ${formatDateTime(entry.unlockAt)}`}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Card className="space-y-5 rounded-xl">
            <DetailRow label="Status" value="Locked" />
            <DetailRow label="Content" value="Sensitive fields are hidden until the unlock time passes." multiline />
          </Card>

          <Card className="rounded-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Metadata</p>
            <div className="mt-4 grid gap-4">
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
      <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{entry.category || 'General'}</Badge>
            {nomineeAccess ? (
              <Badge variant="status" statusTone="archived" className="gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                {ownerLabel ? `Nominee access: ${ownerLabel}` : 'Nominee access'}
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-3 break-words font-heading text-3xl text-textPrimary sm:mt-4 sm:text-4xl">{entry.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-textMuted">{entry.notes || entry.data || 'No notes saved yet.'}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/vault')} className="w-full sm:w-auto">
          Back to vault
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="space-y-6 rounded-xl">
          {accessPolicy?.requiresDualApproval ? (
            <div className="rounded-xl border border-brand/20 bg-brand-light/30 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Two-person access</p>
              <h2 className="mt-2 font-heading text-2xl text-textPrimary">
                {accessPolicy.approvalStatus === 'approved' ? 'Approved access is active' : 'Participant approval required'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-textMuted">
                {accessPolicy.approvalStatus === 'approved'
                  ? `Sensitive content stays open until ${formatDateTime(accessPolicy.approvalExpiresAt)}.`
                  : accessPolicy.approvalStatus === 'pending'
                    ? accessPolicy.requestedByCurrentUser
                      ? `Waiting for ${accessPolicy.approvalTarget?.email || 'the other participant'} to approve this access request from the email link.`
                      : `${accessPolicy.requestedBy?.email || 'The other participant'} requested access. Use the approval email to grant access for 10 minutes.`
                    : 'Either vault participant must request access, and the other participant must approve before sensitive content and attachments are available.'}
              </p>
              {approvalContact?.email ? (
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-textMuted">
                  {approvalContactLabel}: {approvalContact.email}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                {accessPolicy.canRequestApproval && accessPolicy.approvalStatus !== 'approved' ? (
                  <Button
                    type="button"
                    loading={requestApprovalMutation.isPending}
                    onClick={async () => {
                      await requestApprovalMutation.mutateAsync();
                      await entryQuery.refetch();
                    }}
                  >
                    {accessPolicy.approvalStatus === 'pending' && accessPolicy.requestedByCurrentUser ? 'Resend request' : 'Request access approval'}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
          <DetailRow label="Website" value={entry.url} action={entry.url ? (
            <button
              type="button"
              onClick={() => window.open(normalizeUrl(entry.url || ''), '_blank', 'noopener,noreferrer')}
              className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-surface-raised hover:text-brand"
              aria-label="Open website"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          ) : undefined} />
          <DetailRow
            label="Username"
            value={entry.username}
            action={
              entry.username ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (await copyToClipboard(entry.username || '')) toast.success('Username copied');
                  }}
                  className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-surface-raised hover:text-brand"
                  aria-label="Copy username"
                >
                  <Copy className="h-4 w-4" />
                </button>
              ) : undefined
            }
          />
          <DetailRow
            label="Password"
            value={entry.password ? maskValue(entry.password, revealed) : ''}
            action={
              entry.password && ownerView ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRevealed((value) => !value)}
                    className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-surface-raised hover:text-brand"
                    aria-label={revealed ? 'Hide password' : 'Reveal password'}
                  >
                    {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (await copyToClipboard(entry.password || '')) toast.success('Password copied');
                    }}
                    className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-surface-raised hover:text-brand"
                    aria-label="Copy password"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {revealed ? (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand/20 text-xs font-medium text-brand">
                      {secondsLeft}
                    </span>
                  ) : null}
                </div>
              ) : undefined
            }
          />
          <DetailRow label="Notes" value={entry.notes || entry.data} multiline />
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Metadata</p>
            <div className="mt-4 grid gap-4">
              <MetaItem label="Created" value={formatDateTime(entry.createdAt)} />
              <MetaItem label="Updated" value={formatDateTime(entry.updatedAt)} />
              <MetaItem label="Unlocks" value={formatDateTime(entry.unlockAt)} />
              <MetaItem label="Attachments" value={`${attachmentCount} files`} />
              <MetaItem label="Tags" value={entry.tags?.join(', ') || 'None'} />
            </div>
          </Card>

          <Card className="rounded-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Attachments</p>
            <div className="mt-4 grid gap-3">
              {canSeeSensitive && entry.filePath?.length ? (
                entry.filePath.map((fileUrl, index) => (
                  <AttachmentCard
                    key={fileUrl}
                    entryId={entry._id}
                    fileUrl={fileUrl}
                    index={index}
                    downloading={downloadingIndex === index}
                    onDownloadStateChange={(active) => setDownloadingIndex(active ? index : null)}
                    onShare={() => {
                      const label = `Attachment ${index + 1}`;
                      setShareTarget({ filePath: fileUrl, label });
                      setSharePassword('');
                      setGeneratedLink('');
                    }}
                  />
                ))
              ) : attachmentCount ? (
                <p className="text-sm text-textMuted">
                  Attachments are protected until the other vault participant authorizes access.
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
        className="focus-ring fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-medium text-background shadow-card transition hover:-translate-y-px sm:right-6 lg:bottom-8"
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
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Protected share link</p>
            <h3 className="font-heading text-2xl text-textPrimary">{shareTarget?.label}</h3>
            <p className="text-sm text-textMuted">
              Create a protected link for this document only. The recipient will need the password before the download button appears.
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
              label="Generated share link"
              value={generatedLink}
              readOnly
              rightAdornment={
                <button
                  type="button"
                  className="focus-ring rounded-full p-1 text-textMuted transition hover:text-brand"
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

          <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            {generatedLink ? (
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => window.open(generatedLink, '_blank', 'noopener,noreferrer')}>
                Open link
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
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
              className="w-full sm:w-auto"
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
                  const message = error instanceof Error ? error.message : 'Unable to create share link';
                  toast.error(message);
                }
              }}
            >
              Generate link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DetailRow({
  label,
  value,
  action,
  multiline = false
}: {
  label: string;
  value?: string;
  action?: ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2 border-b border-line/70 pb-5 last:border-none last:pb-0">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.22em] text-textMuted">{label}</p>
        {action}
      </div>
      <div className={multiline ? 'break-words rounded-lg bg-surface p-4 text-sm leading-7 text-textPrimary' : 'break-words text-base font-medium text-textPrimary sm:text-lg'}>
        {value || 'Not provided'}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-soft p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-textPrimary">{value}</p>
    </div>
  );
}

function AttachmentCard({
  entryId,
  fileUrl,
  index,
  downloading,
  onDownloadStateChange,
  onShare
}: {
  entryId: string;
  fileUrl: string;
  index: number;
  downloading: boolean;
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
    if (!token) {
      throw new Error('Please log in again.');
    }

    setPreviewLoading(true);

    try {
      const { contentType, objectUrl } = await fetchProtectedResourceBlobUrl(previewEndpoint, {
        headers: authHeaders(token)
      });
      const resolvedKind = getAttachmentKindFromContentType(contentType) || getAttachmentKind(fileUrl);

      setKind(resolvedKind);
      if (resolvedKind === 'file') {
        setPreviewUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }
          return '';
        });
      } else {
        setPreviewUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }
          return objectUrl;
        });
      }

      return {
        objectUrl,
        kind: resolvedKind
      };
    } finally {
      setPreviewLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
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

        if (resolvedKind === 'file') {
          URL.revokeObjectURL(objectUrl);
        }
      })
      .catch(() => {
        if (!active) return;
        setPreviewUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }
          return '';
        });
      });

    return () => {
      active = false;
      if (loadedObjectUrl) {
        URL.revokeObjectURL(loadedObjectUrl);
      }
    };
  }, [fileUrl, previewEndpoint, token]);

  return (
    <div className="group rounded-xl border border-line bg-surface-soft p-3 transition hover:border-brand/40 hover:bg-surface-raised">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
          {image ? <FileImage className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-textPrimary">{label}</p>
          <p className="mt-1 text-xs text-textMuted">
            {image ? 'Image attachment' : pdf ? 'PDF document' : 'Stored attachment'}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 sm:justify-start">
          <button
            type="button"
            onClick={async () => {
              let previewWindow: Window | null = null;

              try {
                if (previewUrl) {
                  window.open(previewUrl, '_blank', 'noopener,noreferrer');
                  return;
                }

                previewWindow = window.open('', '_blank', 'noopener,noreferrer');

                const loadedPreview = await loadPreview();

                if (loadedPreview.kind === 'file') {
                  previewWindow?.close();
                  await downloadProtectedResource(
                    `/api/vault/${entryId}/attachments/${index}/download`,
                    label.toLowerCase().replace(/\s+/g, '-'),
                    {
                      headers: authHeaders(token)
                    }
                  );
                  toast.success(`${downloadLabel} ready`);
                  return;
                }

                if (previewWindow) {
                  previewWindow.location.href = loadedPreview.objectUrl;
                } else {
                  window.open(loadedPreview.objectUrl, '_blank', 'noopener,noreferrer');
                }
              } catch (error) {
                previewWindow?.close();
                const message = error instanceof Error ? error.message : 'Unable to open attachment';
                toast.error(message);
              }
            }}
            className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-surface-raised hover:text-brand"
            aria-label={`Open ${label}`}
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-surface-raised hover:text-brand"
            aria-label={`Share ${label}`}
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                onDownloadStateChange(true);
                await downloadProtectedResource(
                  `/api/vault/${entryId}/attachments/${index}/download`,
                  label.toLowerCase().replace(/\s+/g, '-'),
                  {
                    headers: authHeaders(token)
                  }
                );
                toast.success(`${downloadLabel} ready`);
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Download failed';
                toast.error(message);
              } finally {
                onDownloadStateChange(false);
              }
            }}
            disabled={downloading}
            className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-surface-raised hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`${downloadLabel} for ${label}`}
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {image ? (
        previewUrl ? (
          <img src={previewUrl} alt={label} className="mt-3 h-32 w-full rounded-lg border border-line/70 object-cover" />
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-line/70 bg-surface-muted px-4 py-6 text-sm text-textMuted">
            Image preview unavailable.
          </div>
        )
      ) : null}

      {pdf ? (
        previewUrl ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-line/70 bg-surface-raised">
            <iframe src={previewUrl} title={`${label} preview`} className="h-72 w-full" />
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-line/70 bg-surface-muted px-4 py-6 text-sm text-textMuted">
            PDF preview unavailable.
          </div>
        )
      ) : null}

      <div className="mt-3 flex items-center gap-3 text-xs text-textMuted">
        <span>{downloadLabel}</span>
        {previewLoading ? <span>Loading preview...</span> : null}
        {downloading ? <span>Downloading...</span> : null}
      </div>
    </div>
  );
}
