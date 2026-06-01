import { Download, ExternalLink, FileImage, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth/auth.store';
import { authHeaders } from '@/features/vault/vault.service';
import {
  downloadProtectedResource,
  fetchProtectedResourceBlobUrl,
  getAttachmentKind,
  getAttachmentKindFromContentType,
  type AttachmentKind
} from '@/lib/utils';

interface ProtectedAttachmentPreviewProps {
  label: string;
  fileUrl: string;
  previewEndpoint: string;
  downloadEndpoint?: string;
  compact?: boolean;
}

export function ProtectedAttachmentPreview({
  label,
  fileUrl,
  previewEndpoint,
  downloadEndpoint,
  compact = false
}: ProtectedAttachmentPreviewProps) {
  const token = useAuthStore((state) => state.token);
  const [kind, setKind] = useState<AttachmentKind>(() => getAttachmentKind(fileUrl));
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const image = kind === 'image';
  const pdf = kind === 'pdf';
  const downloadLabel = pdf ? 'Download PDF' : image ? 'Download image' : 'Download file';

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
      .then((result) => {
        if (!result || !active) {
          if (result?.objectUrl) URL.revokeObjectURL(result.objectUrl);
          return;
        }
        loadedObjectUrl = result.objectUrl;
        if (result.kind === 'file') URL.revokeObjectURL(result.objectUrl);
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

  async function openPreview() {
    let previewWindow: Window | null = null;
    try {
      if (previewUrl) {
        window.open(previewUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      previewWindow = window.open('', '_blank', 'noopener,noreferrer');
      const loaded = await loadPreview();
      if (!loaded) return;
      if (loaded.kind === 'file') {
        previewWindow?.close();
        if (downloadEndpoint) {
          await downloadProtectedResource(downloadEndpoint, label.toLowerCase().replace(/\s+/g, '-'), {
            headers: authHeaders(token)
          });
          toast.success(`${downloadLabel} ready`);
        }
        return;
      }
      if (previewWindow) previewWindow.location.href = loaded.objectUrl;
      else window.open(loaded.objectUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      previewWindow?.close();
      toast.error(error instanceof Error ? error.message : 'Unable to open attachment');
    }
  }

  async function handleDownload() {
    if (!downloadEndpoint || !token) return;
    try {
      await downloadProtectedResource(downloadEndpoint, label.toLowerCase().replace(/\s+/g, '-'), {
        headers: authHeaders(token)
      });
      toast.success(`${downloadLabel} ready`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Download failed');
    }
  }

  return (
    <div
      className={
        compact
          ? 'rounded-md border border-line bg-surface px-3 py-2'
          : 'rounded-md border border-line bg-surface p-3 transition-colors hover:bg-surface-muted'
      }
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-textMuted">
          {image ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-textPrimary">{label}</p>
          <p className="text-xs text-textMuted">{image ? 'Image' : pdf ? 'PDF document' : 'Attachment'}</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={openPreview}
            aria-label={`Preview ${label}`}
            className="focus-ring rounded-full p-1.5 text-textMuted transition-colors hover:bg-surface-muted hover:text-textPrimary"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          {downloadEndpoint ? (
            <button
              type="button"
              onClick={handleDownload}
              aria-label={`${downloadLabel} for ${label}`}
              className="focus-ring rounded-full p-1.5 text-textMuted transition-colors hover:bg-surface-muted hover:text-textPrimary"
            >
              <Download className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {image && previewUrl ? (
        <img
          src={previewUrl}
          alt={label}
          className={`mt-3 w-full rounded-md border border-line object-contain ${compact ? 'max-h-40' : 'max-h-48 sm:max-h-56'}`}
        />
      ) : null}

      {pdf && previewUrl ? (
        <div className="mt-3 overflow-hidden rounded-md border border-line">
          <iframe
            src={previewUrl}
            title={`${label} preview`}
            className={`w-full ${compact ? 'h-48 sm:h-56' : 'h-56 sm:h-72'}`}
          />
        </div>
      ) : null}

      {previewLoading ? <p className="mt-2 text-xs text-textMuted">Loading preview...</p> : null}
    </div>
  );
}
