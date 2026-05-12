import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { requestJson } from '@/lib/request';
import { formatDateTime } from '@/lib/utils';

type ApprovalState = 'loading' | 'success' | 'error';

export function ApproveAccessPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ApprovalState>('loading');
  const [message, setMessage] = useState('Granting access...');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    let active = true;

    requestJson<{ message: string; data: { expiresAt: string } }>('/api/vault/approve-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then((payload) => {
        if (!active) return;
        setState('success');
        setMessage(payload.message || 'Access granted successfully');
        setExpiresAt(payload.data.expiresAt);
      })
      .catch((error) => {
        if (!active) return;
        setState('error');
        setMessage(error instanceof Error ? error.message : 'Unable to grant access');
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
      <Card className="w-full text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-textPrimary">
          {state === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {state === 'success' ? <CheckCircle2 className="h-5 w-5" /> : null}
          {state === 'error' ? <XCircle className="h-5 w-5 text-danger" /> : null}
        </div>

        <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-textMuted">Vault access</p>
        <h1 className="mt-2 font-heading text-2xl text-textPrimary">
          {state === 'success' ? 'Access granted' : state === 'error' ? 'Approval failed' : 'Granting access'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-textMuted">
          {message}
          {state === 'success' && expiresAt ? ` Valid until ${formatDateTime(expiresAt)}.` : ''}
        </p>

        <div className="mt-6">
          <Button
            type="button"
            className="w-full sm:w-auto"
            variant={state === 'success' ? 'secondary' : 'primary'}
            onClick={() => navigate('/')}
          >
            Open VaultX
          </Button>
        </div>
      </Card>
    </div>
  );
}
