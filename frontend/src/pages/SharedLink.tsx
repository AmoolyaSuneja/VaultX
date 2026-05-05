import { Download, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { Button, Card, Input } from '@/components/ui';
import { requestJson } from '@/lib/request';
import { downloadProtectedResource, type AttachmentKind } from '@/lib/utils';

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
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
        <Card className="w-full rounded-xl">
          <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Protected link</p>
          <h1 className="mt-3 font-heading text-2xl text-textPrimary sm:text-3xl">Link unavailable</h1>
          <p className="mt-3 text-sm leading-7 text-textMuted">This shared link does not exist anymore or was entered incorrectly.</p>
        </Card>
      </div>
    );
  }

  const downloadLabel = kind === 'pdf' ? 'Download PDF' : kind === 'image' ? 'Download image' : 'Download file';
  const previewUrl = accessToken ? `/api/shared/${shareId}/preview?token=${encodeURIComponent(accessToken)}` : '';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
        <Card className="w-full rounded-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand">
            <LockKeyhole className="h-6 w-6" />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-textMuted">Protected document</p>
          <h1 className="mt-3 font-heading text-2xl text-textPrimary sm:text-3xl">Enter password to continue</h1>
          <p className="mt-3 text-sm leading-7 text-textMuted">
            This link grants access to one shared document only. Enter the password to unlock the download option.
          </p>

          <div className="mt-6 space-y-4">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter shared password"
            />

            <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
              <Button
                type="button"
                className="w-full sm:w-auto"
                loading={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    const payload = await requestJson<{ data: { accessToken: string; kind: AttachmentKind }; message: string }>(
                      `/api/shared/${shareId}/verify`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ password })
                      }
                    );

                    setAccessToken(payload.data.accessToken);
                    setKind(payload.data.kind);
                    toast.success(payload.message || 'Password verified');
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'Verification failed';
                    toast.error(message);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Unlock document
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
                      const message = error instanceof Error ? error.message : 'Download failed';
                      toast.error(message);
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
              <div className="overflow-hidden rounded-xl border border-line bg-surface-raised">
                <iframe src={previewUrl} title="Protected PDF preview" className="h-[60vh] min-h-80 w-full sm:h-[500px]" />
              </div>
            ) : null}

            {accessToken && kind === 'image' ? (
              <div className="overflow-hidden rounded-xl border border-line bg-surface-raised">
                <img src={previewUrl} alt="Protected document preview" className="max-h-[60vh] w-full object-contain sm:max-h-[500px]" />
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
