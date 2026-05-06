import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, Input, Textarea } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  activateNomineeAccess,
  claimNomineeAccess,
  getNomineeStatus,
  listNomineeClaims,
  registerNominee,
  revokeNominee,
  type AdminNomineeClaim,
  type NominationReference,
  type NomineeCondition,
  type NomineeRecord
} from '@/features/nominee/nominee.service';

const conditionLabels: Record<NomineeCondition, string> = {
  death: 'Death',
  incapacity: 'Incapacity',
  inactivity: 'Inactivity + review',
  courtOrder: 'Court order'
};

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function SettingsPage() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [nominee, setNominee] = useState<NomineeRecord | null>(null);
  const [nominatedBy, setNominatedBy] = useState<NominationReference[]>([]);
  const [nomineeForm, setNomineeForm] = useState({
    name: '',
    email: '',
    relationship: '',
    condition: 'death' as NomineeCondition
  });
  const [claimForm, setClaimForm] = useState({
    ownerEmail: '',
    proofType: '',
    proofNotes: '',
    proofDocument: null as File | null
  });
  const [reviewForm, setReviewForm] = useState({
    ownerEmail: '',
    verificationNotes: ''
  });
  const [adminClaims, setAdminClaims] = useState<AdminNomineeClaim[]>([]);
  const [isLoadingNominee, setIsLoadingNominee] = useState(false);
  const [isSavingNominee, setIsSavingNominee] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    if (!token) return;

    setIsLoadingNominee(true);
    getNomineeStatus(token)
      .then((response) => {
        setNominee(response.data.nominee);
        setNominatedBy(response.data.nominatedBy ?? []);
        if (response.data.nominee) {
          setNomineeForm({
            name: response.data.nominee.name,
            email: response.data.nominee.email,
            relationship: response.data.nominee.relationship,
            condition: response.data.nominee.condition
          });
        }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load nominee status'))
      .finally(() => setIsLoadingNominee(false));
  }, [token]);

  useEffect(() => {
    if (!token || user?.role !== 'admin') return;

    refreshAdminClaims().catch((error) =>
      toast.error(error instanceof Error ? error.message : 'Could not load nominee claims')
    );
  }, [token, user?.role]);

  async function refreshNomineeStatus() {
    if (!token) return;
    const response = await getNomineeStatus(token);
    setNominee(response.data.nominee);
    setNominatedBy(response.data.nominatedBy ?? []);
  }

  async function refreshAdminClaims() {
    if (!token || user?.role !== 'admin') return;
    const response = await listNomineeClaims(token);
    setAdminClaims(response.data ?? []);
  }

  async function handleNomineeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setIsSavingNominee(true);
    try {
      const response = await registerNominee(token, nomineeForm);
      setNominee(response.data);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save nominee');
    } finally {
      setIsSavingNominee(false);
    }
  }

  async function handleRevokeNominee() {
    if (!token) return;

    setIsSavingNominee(true);
    try {
      const response = await revokeNominee(token);
      setNominee(response.data);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not revoke nominee');
    } finally {
      setIsSavingNominee(false);
    }
  }

  async function handleClaimSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setIsClaiming(true);
    try {
      const response = await claimNomineeAccess(token, claimForm);
      toast.success(response.message);
      setClaimForm((current) => ({ ...current, proofType: '', proofNotes: '', proofDocument: null }));
      await refreshNomineeStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit claim');
    } finally {
      setIsClaiming(false);
    }
  }

  async function handleActivate() {
    if (!token) return;

    setIsReviewing(true);
    try {
      const response = await activateNomineeAccess(token, reviewForm);
      toast.success(response.message);
      await refreshNomineeStatus();
      await refreshAdminClaims();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not activate nominee access');
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Nominee access</p>
        <h1 className="mt-3 font-heading text-3xl text-textPrimary sm:text-4xl">Manage emergency succession.</h1>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <Card className="rounded-xl xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Nominee access</p>
              <h2 className="mt-2 text-xl font-semibold text-textPrimary">Emergency succession</h2>
            </div>
            {nominee ? (
              <Badge variant="status" statusTone={nominee.status === 'active' ? 'active' : nominee.status === 'revoked' ? 'flagged' : 'archived'}>
                {nominee.status}
              </Badge>
            ) : null}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={handleNomineeSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nominee name"
                  value={nomineeForm.name}
                  onChange={(event) => setNomineeForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Trusted person's name"
                />
                <Input
                  label="Nominee email"
                  type="email"
                  value={nomineeForm.email}
                  onChange={(event) => setNomineeForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="nominee@example.com"
                />
                <Input
                  label="Relationship"
                  value={nomineeForm.relationship}
                  onChange={(event) => setNomineeForm((current) => ({ ...current, relationship: event.target.value }))}
                  placeholder="Brother, spouse, lawyer"
                />
                <label className="grid gap-2 text-sm text-textMuted">
                  <span className="text-xs font-medium uppercase tracking-[0.22em] text-textMuted">Activation condition</span>
                  <select
                    value={nomineeForm.condition}
                    onChange={(event) =>
                      setNomineeForm((current) => ({ ...current, condition: event.target.value as NomineeCondition }))
                    }
                    className="focus-ring surface-field min-h-11 rounded-md px-3 py-2.5 text-sm text-textPrimary outline-none transition focus:border-brand focus:shadow-focus"
                  >
                    {Object.entries(conditionLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {nominee ? (
                <div className="rounded-lg bg-surface p-4 text-sm leading-7 text-textMuted">
                  Requested {formatDate(nominee.requestedAt)}. Approved {formatDate(nominee.approvedAt)}. Activated{' '}
                  {formatDate(nominee.activatedAt)}.
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {nominee && nominee.status !== 'revoked' ? (
                  <Button type="button" variant="danger" onClick={handleRevokeNominee} loading={isSavingNominee}>
                    Revoke nominee
                  </Button>
                ) : null}
                <Button type="submit" loading={isSavingNominee || isLoadingNominee}>
                  <ShieldCheck className="h-4 w-4" />
                  Save nominee
                </Button>
              </div>
            </form>

            <div className="grid gap-4">
              <div className="rounded-lg border border-line bg-surface p-4 text-sm leading-7 text-textMuted">
                Death, incapacity, and court-order claims should be reviewed by an admin against legal proof. Inactivity only starts review; it does not activate access by itself.
              </div>
              {nominatedBy.length ? (
                <div className="grid gap-3">
                  {nominatedBy.map((item) => (
                    <button
                      key={item.ownerId}
                      type="button"
                      onClick={() => {
                        setClaimForm((current) => ({ ...current, ownerEmail: item.ownerEmail }));
                        setReviewForm((current) => ({ ...current, ownerEmail: item.ownerEmail }));
                      }}
                      className="focus-ring rounded-lg border border-line bg-surface-soft p-4 text-left transition hover:border-brand/40 hover:bg-surface-raised"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-textPrimary">{item.ownerName}</span>
                        <Badge variant="status" statusTone={item.nominee.status === 'active' ? 'active' : 'archived'}>
                          {item.nominee.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-textMuted">{item.ownerEmail}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="rounded-xl">
          <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Nominee claim</p>
          <form onSubmit={handleClaimSubmit} className="mt-5 grid gap-4">
            <Input
              label="Owner email"
              type="email"
              value={claimForm.ownerEmail}
              onChange={(event) => setClaimForm((current) => ({ ...current, ownerEmail: event.target.value }))}
              placeholder="owner@example.com"
            />
            <Input
              label="Proof type"
              value={claimForm.proofType}
              onChange={(event) => setClaimForm((current) => ({ ...current, proofType: event.target.value }))}
              placeholder="Death certificate, court order, power of attorney"
            />
            <Textarea
              label="Proof notes"
              value={claimForm.proofNotes}
              onChange={(event) => setClaimForm((current) => ({ ...current, proofNotes: event.target.value }))}
              placeholder="Record proof identifiers, issuing authority, dates, and verification context."
            />
            <label className="grid gap-2 text-sm text-textMuted">
              <span className="text-xs font-medium uppercase tracking-[0.22em] text-textMuted">Proof document</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(event) =>
                  setClaimForm((current) => ({ ...current, proofDocument: event.target.files?.[0] ?? null }))
                }
                className="focus-ring rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-textPrimary file:mr-3 file:rounded-md file:border-0 file:bg-brand-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand"
              />
              {claimForm.proofDocument ? (
                <span className="text-xs text-textMuted">{claimForm.proofDocument.name}</span>
              ) : null}
            </label>
            <div className="flex justify-end">
              <Button type="submit" loading={isClaiming}>
                Submit claim
              </Button>
            </div>
          </form>
        </Card>

        {user?.role === 'admin' ? (
          <Card className="rounded-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Claim review</p>
            <div className="mt-5 grid gap-4">
              {adminClaims.length ? (
                <div className="grid gap-3">
                  {adminClaims.map((item) => (
                    <div
                      key={item.ownerId}
                      className="rounded-lg border border-line bg-surface-soft p-4 transition hover:border-brand/40 hover:bg-surface-raised"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium text-textPrimary">{item.ownerName}</p>
                          <p className="mt-1 text-sm text-textMuted">{item.ownerEmail}</p>
                        </div>
                        <Badge variant="status" statusTone={item.nominee.status === 'active' ? 'active' : 'archived'}>
                          {item.nominee.status}
                        </Badge>
                      </div>
                      <div className="mt-3 rounded-md border border-line bg-surface p-3 text-sm leading-6 text-textMuted">
                        <p>
                          Nominee: <span className="text-textPrimary">{item.nominee.name}</span> ({item.nominee.email})
                        </p>
                        <p>Condition: {conditionLabels[item.nominee.condition]}</p>
                        <p>Proof: {item.nominee.claim?.proofType || 'Not recorded'}</p>
                        <p>Submitted: {formatDate(item.nominee.claim?.submittedAt)}</p>
                        <p className="mt-2">{item.nominee.claim?.proofNotes}</p>
                      </div>
                      {item.nominee.claim?.proofDocumentUrl ? (
                        <a
                          href={item.nominee.claim.proofDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Open proof document
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                      <Button
                        type="button"
                        variant={reviewForm.ownerEmail === item.ownerEmail ? 'secondary' : 'ghost'}
                        className="mt-3 w-full"
                        onClick={() => setReviewForm((current) => ({ ...current, ownerEmail: item.ownerEmail }))}
                      >
                        {reviewForm.ownerEmail === item.ownerEmail ? 'Selected for activation' : 'Review this claim'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-line bg-surface p-4 text-sm text-textMuted">
                  No nominee claims are waiting for review.
                </div>
              )}
              <Textarea
                label="Final verification notes"
                value={reviewForm.verificationNotes}
                onChange={(event) => setReviewForm((current) => ({ ...current, verificationNotes: event.target.value }))}
                placeholder="Document how the claim was verified before activation."
              />
              <Button type="button" onClick={handleActivate} loading={isReviewing} disabled={!reviewForm.ownerEmail || !adminClaims.length}>
                Verify and activate access
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
