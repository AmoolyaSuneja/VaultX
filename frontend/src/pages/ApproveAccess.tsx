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
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
      <Card className="w-full rounded-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
          {state === 'loading' ? <Loader2 className="h-7 w-7 animate-spin" /> : null}
          {state === 'success' ? <CheckCircle2 className="h-7 w-7" /> : null}
          {state === 'error' ? <XCircle className="h-7 w-7 text-danger" /> : null}
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-textMuted">Vault access</p>
        <h1 className="mt-3 font-heading text-2xl text-textPrimary sm:text-3xl">
          {state === 'success' ? 'Access granted successfully' : state === 'error' ? 'Approval failed' : 'Granting access'}
        </h1>
        <p className="mt-3 text-sm leading-7 text-textMuted">
          {message}
          {state === 'success' && expiresAt ? ` The requester can open the document until ${formatDateTime(expiresAt)}.` : ''}
        </p>

        <div className="mt-6">
          <Button type="button" className="w-full sm:w-auto" variant={state === 'success' ? 'secondary' : 'primary'} onClick={() => navigate('/')}>
            Open VaultX
          </Button>
        </div>
      </Card>
    </div>
  );
}
