import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth.store';
import { useUpdateProfile } from '@/features/user/useUser';
import { uploadProfileAvatar } from '@/features/user/user.service';

export function ProfilePage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setAvatarUrl(user?.avatarUrl ?? '');
  }, [user]);

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return avatarUrl || '';
  }, [file, avatarUrl]);

  useEffect(() => {
    return () => {
      if (file) URL.revokeObjectURL(previewUrl);
    };
  }, [file, previewUrl]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      toast.error('Please log in again.');
      return;
    }

    setIsSaving(true);

    try {
      let nextAvatar = avatarUrl;
      if (file) {
        nextAvatar = await uploadProfileAvatar(token, file);
      }

      const response = await updateProfile.mutateAsync({
        token,
        payload: { name, avatarUrl: nextAvatar }
      });

      setName(response.data.name ?? name);
      setAvatarUrl(response.data.avatarUrl ?? nextAvatar);
      setFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-5 pb-2 sm:space-y-6">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-textMuted">Profile</p>
        <h1 className="mt-1 font-heading text-2xl text-textPrimary sm:text-3xl lg:text-[34px]">Your account</h1>
      </div>

      <Card className="min-w-0 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-muted text-base font-semibold text-textPrimary">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span>{user?.name?.[0]?.toUpperCase() ?? 'U'}</span>
              )}
            </div>
            <div className="grid w-full min-w-0 gap-1.5 text-sm">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Photo</span>
              <input
                type="file"
                accept="image/*"
                disabled={isSaving}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="w-full max-w-full text-xs text-textMuted file:mr-3 file:max-w-[55%] file:truncate file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-textPrimary"
              />
            </div>
          </div>

          <Input
            label="Display name"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input label="Email" value={user?.email ?? ''} disabled />

          <div className="flex justify-stretch sm:justify-end">
            <Button type="submit" className="w-full sm:w-auto" loading={isSaving} disabled={isSaving}>
              Save profile
            </Button>
          </div>
        </form>
      </Card>

      <Card className="min-w-0 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-textMuted">Nominee access</p>
            <h2 className="mt-1 font-heading text-lg text-textPrimary sm:text-xl">Emergency succession</h2>
            <p className="mt-1 text-sm leading-6 text-textMuted">
              Designate a trusted person who can claim vault access under defined conditions.
            </p>
          </div>
          <Button
            type="button"
            className="w-full shrink-0 sm:w-auto sm:self-end"
            variant="secondary"
            onClick={() => navigate('/vault/settings')}
          >
            <ShieldCheck className="h-4 w-4" />
            Manage nominee
          </Button>
        </div>
      </Card>
    </div>
  );
}
