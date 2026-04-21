import { Download, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { Button, Card, Input } from '@/components/ui';
import { downloadProtectedResource } from '@/lib/utils';

type ShareKind = 'image' | 'pdf' | 'file';

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(path, init);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload as T;
}

export function SharedLinkPage() {
  const { shareId = '' } = useParams();
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [kind, setKind] = useState<ShareKind>('file');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [linkExists, setLinkExists] = useState(true);

  useEffect(() => {
    let mounted = true;

    request<{ data: { kind: ShareKind } }>(`/api/shared/${shareId}`)
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
          <h1 className="mt-3 font-heading text-3xl text-textPrimary">Link unavailable</h1>
          <p className="mt-3 text-sm leading-7 text-textMuted">This shared link does not exist anymore or was entered incorrectly.</p>
        </Card>
      </div>
    );
  }

  const downloadLabel = kind === 'pdf' ? 'Download PDF' : kind === 'image' ? 'Download image' : 'Download file';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute left-[-120px] top-[120px] h-[320px] w-[320px] rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute right-[-80px] top-[240px] h-[300px] w-[300px] rounded-full bg-accent/15 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
        <Card className="w-full rounded-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand">
            <LockKeyhole className="h-6 w-6" />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-textMuted">Protected document</p>
          <h1 className="mt-3 font-heading text-3xl text-textPrimary">Enter password to continue</h1>
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

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                loading={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    const payload = await request<{ data: { accessToken: string; kind: ShareKind }; message: string }>(
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
          </div>
        </Card>
      </div>
    </div>
  );
}
