import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { motion } from 'framer-motion';
import { CheckCircle2, Globe, Link2, Sparkles, X } from 'lucide-react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { Button, Input, Textarea, Toggle } from '@/components/ui';
import { defaultCategories } from '@/lib/constants';
import { slideRight } from '@/lib/motion';
import { normalizeUrl, parseTags, toDateTimeInputValue } from '@/lib/utils';
import { entrySchema, type EntryValues } from '@/lib/validators';
import type { VaultEntry } from '@/features/vault/vault.types';
import { FileUpload } from './FileUpload';

interface EntryFormProps {
  open: boolean;
  mode: 'create' | 'edit';
  entry?: VaultEntry;
  onClose: () => void;
    onSubmit: (payload: {
    title: string;
    category: string;
    url?: string;
    username?: string;
    password?: string;
    notes?: string;
    data?: string;
    tags?: string[];
      files?: File[];
      unlockAt?: string;
      requiresDualApproval?: boolean;
      secondApproverEmail?: string;
    }) => Promise<void>;
}

export function EntryForm({ open, mode, entry, onClose, onSubmit }: EntryFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const submitLockedRef = useRef(false);

  const form = useForm<EntryValues>({
    resolver: zodResolver(entrySchema) as Resolver<EntryValues>,
    defaultValues: {
      title: '',
      category: 'General',
      url: '',
      username: '',
      password: '',
      notes: '',
      tagsText: '',
      requiresDualApproval: false,
      secondApproverEmail: '',
      unlockAt: ''
    }
  });

  useEffect(() => {
    if (!open) {
      submitLockedRef.current = false;
      setSubmitState('idle');
    }
  }, [open]);

  useEffect(() => {
    if (!entry) {
      form.reset({
        title: '',
        category: 'General',
        url: '',
        username: '',
        password: '',
        notes: '',
        tagsText: '',
        requiresDualApproval: false,
        secondApproverEmail: '',
        unlockAt: ''
      });
      setFiles([]);
      return;
    }

    form.reset({
      title: entry.title,
      category: entry.category || 'General',
      url: entry.url || '',
      username: entry.username || '',
      password: entry.password || '',
      notes: entry.notes || entry.data || '',
      tagsText: entry.tags?.join(', ') || '',
      requiresDualApproval: entry.requiresDualApproval || false,
      secondApproverEmail: entry.secondApproverEmail || entry.accessPolicy?.secondApprover?.email || '',
      unlockAt: toDateTimeInputValue(entry.unlockAt)
    });
    setFiles([]);
  }, [entry, form, open]);

  const categories = useMemo(() => {
    const current = form.watch('category');
    return Array.from(new Set([...defaultCategories, current].filter(Boolean)));
  }, [form]);

  async function handleSubmit(values: EntryValues) {
    if (submitLockedRef.current || submitState !== 'idle') return;

    submitLockedRef.current = true;
    setSubmitState('saving');

    try {
      await onSubmit({
        title: values.title,
        category: values.category,
        url: values.url || '',
        username: '',
        password: '',
        notes: values.notes || '',
        data: values.notes || '',
        tags: parseTags(values.tagsText || ''),
        files,
        unlockAt: values.unlockAt || '',
        requiresDualApproval: values.requiresDualApproval,
        secondApproverEmail: values.secondApproverEmail || ''
      });
      setSubmitState('saved');
      window.setTimeout(onClose, 450);
    } catch (error) {
      submitLockedRef.current = false;
      setSubmitState('idle');
      throw error;
    }
  }

  const dualApprovalEnabled = form.watch('requiresDualApproval');
  const isSubmitting = submitState !== 'idle' || form.formState.isSubmitting;
  const submitLabel =
    submitState === 'saved'
      ? 'Saved'
      : submitState === 'saving'
        ? 'Saving...'
        : mode === 'create'
          ? 'Save entry'
          : 'Save changes';
  const closePanel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[75]" onClose={closePanel}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-background/75 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex w-screen max-w-full justify-end">
              <DialogPanel className="pointer-events-auto h-full w-full sm:max-w-lg lg:max-w-2xl">
                <motion.div
                  {...slideRight}
                  className="relative flex h-full w-full transform-gpu flex-col border-l border-line bg-panel shadow-card backdrop-blur-panel will-change-transform"
                >
                <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-6 sm:py-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-textMuted">
                      {mode === 'create' ? 'Create entry' : 'Edit entry'}
                    </p>
                    <h3 className="mt-2 font-heading text-2xl text-textPrimary sm:text-3xl">
                      {mode === 'create' ? 'Capture something important' : 'Refine vault details'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closePanel}
                    disabled={isSubmitting}
                    className="focus-ring rounded-full p-2 text-textMuted transition hover:bg-surface-raised hover:text-brand"
                    aria-label="Close panel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
                  <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:space-y-8 sm:px-6 sm:py-6">
                    <section className="space-y-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Basic info</p>
                      <Input
                        label="Title"
                        placeholder="Acme workspace"
                        error={form.formState.errors.title?.message}
                        {...form.register('title')}
                      />
                      <label className="grid gap-2 text-sm text-textMuted">
                        <span className="text-xs font-medium uppercase tracking-[0.22em]">Category</span>
                        <input
                          list="vault-categories"
                          className="focus-ring rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-textPrimary transition placeholder:text-textMuted/70 focus:border-brand focus:shadow-focus"
                          placeholder="Choose or create a category"
                          {...form.register('category')}
                        />
                        <datalist id="vault-categories">
                          {categories.map((category) => (
                            <option key={category} value={category} />
                          ))}
                        </datalist>
                      </label>
                      <Input
                        label="URL / website"
                        placeholder="https://"
                        error={form.formState.errors.url?.message}
                        rightAdornment={
                          <button
                            type="button"
                            className="focus-ring rounded-full p-1 text-textMuted transition hover:text-brand"
                            aria-label="Visit website"
                            onClick={() => {
                              const url = form.getValues('url');
                              if (!url) return;
                              window.open(normalizeUrl(url), '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <Globe className="h-4 w-4" />
                          </button>
                        }
                        {...form.register('url')}
                      />
                    </section>

                    <section className="space-y-4 border-t border-line pt-6">
                      <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Notes</p>
                      <Textarea
                        label="Secure notes"
                        placeholder="Markdown-style notes, recovery steps, context, or internal documentation."
                        error={form.formState.errors.notes?.message}
                        {...form.register('notes')}
                      />
                      <Input
                        label="Tags"
                        placeholder="finance, shared, urgent"
                        error={form.formState.errors.tagsText?.message}
                        leftAdornment={<Link2 className="h-4 w-4 text-textMuted" />}
                        {...form.register('tagsText')}
                      />
                      <Input
                        label="Unlock at"
                        type="datetime-local"
                        hint="Leave blank to make this entry available immediately."
                        error={form.formState.errors.unlockAt?.message}
                        {...form.register('unlockAt')}
                      />
                    </section>

                    <section className="space-y-4 border-t border-line pt-6">
                      <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Dual approval</p>
                      <Toggle
                        label="Require a second user to approve access"
                        checked={dualApprovalEnabled}
                        onChange={(value) => form.setValue('requiresDualApproval', value, { shouldDirty: true, shouldValidate: true })}
                      />
                      {dualApprovalEnabled ? (
                        <Input
                          label="Second approver email"
                          placeholder="teammate@company.com"
                          error={form.formState.errors.secondApproverEmail?.message}
                          hint="This user will receive an in-app approval request before the owner can open sensitive content."
                          {...form.register('secondApproverEmail')}
                        />
                      ) : null}
                    </section>

                    <section className="space-y-4 border-t border-line pt-6">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <p className="text-xs uppercase tracking-[0.22em] text-textMuted">File attachments</p>
                      </div>
                      <FileUpload files={files} onChange={setFiles} existingFiles={entry?.filePath} />
                    </section>
                  </div>

                  <div className="sticky bottom-0 grid gap-3 border-t border-line bg-panel/95 px-4 py-4 backdrop-blur-panel sm:flex sm:items-center sm:justify-end sm:px-6">
                    <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={closePanel} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto" loading={submitState === 'saving'} disabled={isSubmitting}>
                      {submitState === 'saved' ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}
                      {submitLabel}
                    </Button>
                  </div>
                </form>
                </motion.div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
