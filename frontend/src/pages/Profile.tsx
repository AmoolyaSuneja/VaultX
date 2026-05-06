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
      if (file) {
        URL.revokeObjectURL(previewUrl);
      }
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
        payload: {
          name,
          avatarUrl: nextAvatar
        }
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
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Profile</p>
        <h1 className="mt-3 font-heading text-3xl text-textPrimary sm:text-4xl">Keep your identity up to date.</h1>
      </div>

      <Card className="rounded-xl">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-raised text-lg font-semibold text-textPrimary">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span>{user?.name?.[0]?.toUpperCase() ?? 'U'}</span>
              )}
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-[0.22em] text-textMuted">Profile photo</label>
              <input
                type="file"
                accept="image/*"
                disabled={isSaving}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="text-sm text-textMuted"
              />
              <p className="text-xs text-textMuted">Upload a square image for best results.</p>
            </div>
          </div>

          <Input
            label="Display name"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input label="Email" value={user?.email ?? ''} disabled />

          <div className="flex justify-end">
            <Button type="submit" className="w-full sm:w-auto" loading={isSaving} disabled={isSaving}>
              Save profile
            </Button>
          </div>
        </form>
      </Card>

      <Card className="rounded-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Nominee access</p>
            <h2 className="mt-2 text-xl font-semibold text-textPrimary">Emergency succession</h2>
          </div>
          <Button type="button" className="w-full sm:w-auto" onClick={() => navigate('/vault/settings')}>
            <ShieldCheck className="h-4 w-4" />
            Add a nominee
          </Button>
        </div>
      </Card>
    </div>
  );
}
