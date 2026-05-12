import { Download, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { Button, Card, Input } from '@/components/ui';
import { requestJson } from '@/lib/request';
import { downloadProtectedResource, type AttachmentKind } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

export function SharedLinkPage() {
  const { shareId = '' } = useParams();
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [kind, setKind] = useState<AttachmentKind>('file');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [linkExists, setLinkExists] = useState(true);

  useEffect(() => {
    let mounted = true;

    requestJson<{ data: { kind: AttachmentKind } }>(`/api/shared/${shareId}`)
      .then((payload) => {
        if (!mounted) return;
        setKind(payload.data.kind);
      })
      .catch(() => {
        if (!mounted) return;
        setLinkExists(false);
      });

    return () => {
      mounted = false;
    };
  }, [shareId]);

  if (!linkExists) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
        <Card className="w-full">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-textMuted">Protected link</p>
          <h1 className="mt-2 font-heading text-2xl text-textPrimary">Link unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-textMuted">
            This shared link does not exist anymore or was entered incorrectly.
          </p>
        </Card>
      </div>
    );
  }

  const downloadLabel = kind === 'pdf' ? 'Download PDF' : kind === 'image' ? 'Download image' : 'Download file';
  const previewUrl = accessToken ? `/api/shared/${shareId}/preview?token=${encodeURIComponent(accessToken)}` : '';

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
      <Card className="w-full">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-textPrimary">
          <LockKeyhole className="h-5 w-5" />
        </div>

        <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-textMuted">
          Protected document
        </p>
        <h1 className="mt-2 font-heading text-2xl text-textPrimary">Enter password to continue</h1>
        <p className="mt-2 text-sm leading-6 text-textMuted">
          This link grants access to one shared document only. Enter the password to unlock the download.
        </p>

        <div className="mt-6 space-y-4">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter shared password"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="w-full sm:w-auto"
              loading={loading}
              onClick={async () => {
                try {
                  setLoading(true);
                  const payload = await requestJson<{
                    data: { accessToken: string; kind: AttachmentKind };
                    message: string;
                  }>(`/api/shared/${shareId}/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                  });

                  setAccessToken(payload.data.accessToken);
                  setKind(payload.data.kind);
                  toast.success(payload.message || 'Password verified');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Verification failed');
                } finally {
                  setLoading(false);
                }
              }}
            >
              Unlock
            </Button>

            {accessToken ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                loading={downloading}
                onClick={async () => {
                  try {
                    setDownloading(true);
                    await downloadProtectedResource(
                      `/api/shared/${shareId}/download?token=${encodeURIComponent(accessToken)}`,
                      'shared-document'
                    );
                    toast.success(`${downloadLabel} ready`);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Download failed');
                  } finally {
                    setDownloading(false);
                  }
                }}
              >
                <Download className="h-4 w-4" />
                {downloadLabel}
              </Button>
            ) : null}
          </div>

          {accessToken && kind === 'pdf' ? (
            <div className="overflow-hidden rounded-md border border-line bg-surface">
              <iframe src={previewUrl} title="Protected PDF preview" className="h-[60vh] min-h-80 w-full sm:h-[500px]" />
            </div>
          ) : null}

          {accessToken && kind === 'image' ? (
            <div className="overflow-hidden rounded-md border border-line bg-surface">
              <img src={previewUrl} alt="Protected document preview" className="max-h-[60vh] w-full object-contain sm:max-h-[500px]" />
            </div>
          ) : null}

          <p className="border-t border-line pt-4 text-center text-[11px] uppercase tracking-[0.18em] text-textMuted">
            Shared via {APP_NAME}
          </p>
        </div>
      </Card>
    </div>
  );
}
