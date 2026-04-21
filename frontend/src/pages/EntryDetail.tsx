import { Copy, Download, ExternalLink, Eye, EyeOff, FileImage, FileText, Pencil, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { EntryForm } from '@/components/forms/EntryForm';
import { Badge, Button, Card, Input, Modal } from '@/components/ui';
import { useCreateShareLink, useVaultEntry, useUpdateEntry } from '@/features/vault/useVault';
import { copyToClipboard, downloadAttachment, formatDateTime, getAttachmentKind, maskValue, normalizeUrl } from '@/lib/utils';

export function EntryDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const entryQuery = useVaultEntry(id);
  const updateMutation = useUpdateEntry(id);
  const createShareLinkMutation = useCreateShareLink(id);
  const [revealed, setRevealed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [editing, setEditing] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [shareTarget, setShareTarget] = useState<{ filePath: string; label: string } | null>(null);
  const [sharePassword, setSharePassword] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const entry = entryQuery.data;

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

  if (!entry) {
    return (
      <Card className="rounded-xl">
        <p className="text-sm text-textMuted">Loading entry details...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Badge>{entry.category || 'General'}</Badge>
          <h1 className="mt-4 font-heading text-4xl text-textPrimary">{entry.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-textMuted">{entry.notes || entry.data || 'No notes saved yet.'}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/vault')}>
          Back to vault
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="space-y-6 rounded-xl">
          <DetailRow label="Website" value={entry.url} action={entry.url ? (
            <button
              type="button"
              onClick={() => window.open(normalizeUrl(entry.url || ''), '_blank', 'noopener,noreferrer')}
              className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-white/70 hover:text-brand"
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
                  className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-white/70 hover:text-brand"
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
              entry.password ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRevealed((value) => !value)}
                    className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-white/70 hover:text-brand"
                    aria-label={revealed ? 'Hide password' : 'Reveal password'}
                  >
                    {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (await copyToClipboard(entry.password || '')) toast.success('Password copied');
                    }}
                    className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-white/70 hover:text-brand"
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
              <MetaItem label="Attachments" value={`${entry.filePath?.length ?? 0} files`} />
              <MetaItem label="Tags" value={entry.tags?.join(', ') || 'None'} />
            </div>
          </Card>

          <Card className="rounded-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Attachments</p>
            <div className="mt-4 grid gap-3">
              {entry.filePath?.length ? (
                entry.filePath.map((fileUrl, index) => {
                  const kind = getAttachmentKind(fileUrl);
                  const image = kind === 'image';
                  const label = `Attachment ${index + 1}`;
                  const downloadLabel = kind === 'pdf' ? 'Download PDF' : kind === 'image' ? 'Download image' : 'Download file';

                  return (
                    <div key={fileUrl} className="group rounded-xl border border-line bg-white/55 p-3 transition hover:border-brand/40 hover:bg-white/75">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                          {image ? <FileImage className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-textPrimary">{label}</p>
                          <p className="mt-1 text-xs text-textMuted">
                            {kind === 'image' ? 'Image attachment' : kind === 'pdf' ? 'PDF document' : 'Stored attachment'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                            className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-white/80 hover:text-brand"
                            aria-label={`Open ${label}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShareTarget({ filePath: fileUrl, label });
                              setSharePassword('');
                              setGeneratedLink('');
                            }}
                            className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-white/80 hover:text-brand"
                            aria-label={`Share ${label}`}
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setDownloadingIndex(index);
                                await downloadAttachment(fileUrl, label.toLowerCase().replace(/\s+/g, '-'));
                                toast.success(`${downloadLabel} ready`);
                              } catch (error) {
                                const message = error instanceof Error ? error.message : 'Download failed';
                                toast.error(message);
                              } finally {
                                setDownloadingIndex(null);
                              }
                            }}
                            disabled={downloadingIndex === index}
                            className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-white/80 hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={`${downloadLabel} for ${label}`}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {image ? (
                        <img src={fileUrl} alt={label} className="mt-3 h-32 w-full rounded-lg border border-line/70 object-cover" />
                      ) : null}
                      <div className="mt-3 flex items-center gap-3 text-xs text-textMuted">
                        <span>{downloadLabel}</span>
                        {downloadingIndex === index ? <span>Downloading...</span> : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-textMuted">No files attached to this entry.</p>
              )}
            </div>
          </Card>

          <Card className="rounded-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Related context</p>
            <div className="mt-4 space-y-3 text-sm text-textMuted">
              <p>This MVP stores a lightweight activity summary in the right rail.</p>
              <p>Detailed per-entry activity can expand from here once the backend logs are scoped by entry and user.</p>
            </div>
          </Card>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="focus-ring fixed bottom-24 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-medium text-white shadow-card transition hover:-translate-y-px lg:bottom-8"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </button>

      <EntryForm
        open={editing}
        mode="edit"
        entry={entry}
        onClose={() => setEditing(false)}
        onSubmit={async (payload) => {
          await updateMutation.mutateAsync(payload);
          setEditing(false);
        }}
      />

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
              Create a localhost link for this document only. The recipient will need the password before the download button appears.
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
              label="Generated localhost link"
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

          <div className="flex flex-wrap items-center justify-end gap-3">
            {generatedLink ? (
              <Button type="button" variant="secondary" onClick={() => window.open(generatedLink, '_blank', 'noopener,noreferrer')}>
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
      <div className={multiline ? 'rounded-lg bg-white/60 p-4 text-sm leading-7 text-textPrimary' : 'text-lg font-medium text-textPrimary'}>
        {value || 'Not provided'}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/55 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 text-sm font-medium text-textPrimary">{value}</p>
    </div>
  );
}
