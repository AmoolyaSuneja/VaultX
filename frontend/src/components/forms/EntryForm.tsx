import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { motion } from 'framer-motion';
import { CheckCircle2, Link2, Sparkles, X } from 'lucide-react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { Button, Input, Textarea, Toggle } from '@/components/ui';
import { defaultCategories } from '@/lib/constants';
import { slideRight } from '@/lib/motion';
import { parseTags, toDateTimeInputValue } from '@/lib/utils';
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
          <div className="fixed inset-0 bg-textPrimary/20 backdrop-blur-[2px]" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-0 flex items-end justify-center sm:inset-y-0 sm:left-auto sm:right-0 sm:items-stretch sm:justify-end">
              <DialogPanel className="pointer-events-auto flex max-h-[min(92dvh,100%)] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-panel sm:h-full sm:max-h-none sm:max-w-lg sm:rounded-none sm:border-l sm:border-t-0 lg:max-w-2xl">
                <motion.div
                  {...slideRight}
                  className="relative flex min-h-0 flex-1 flex-col bg-panel"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-6 sm:py-5">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">
                        {mode === 'create' ? 'Create entry' : 'Edit entry'}
                      </p>
                      <h3 className="mt-1.5 font-heading text-2xl text-textPrimary">
                        {mode === 'create' ? 'New vault entry' : 'Refine vault entry'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={closePanel}
                      disabled={isSubmitting}
                      className="focus-ring rounded-full p-2 text-textMuted transition-colors hover:bg-surface-muted hover:text-textPrimary"
                      aria-label="Close panel"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
                    <div
                      data-lenis-prevent
                      className="scrollbar-thin flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 sm:space-y-7 sm:px-6 sm:py-6"
                    >
                      <section className="space-y-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Basic info</p>
                        <Input
                          label="Title"
                          placeholder="Acme workspace"
                          error={form.formState.errors.title?.message}
                          {...form.register('title')}
                        />
                        <label className="grid gap-1.5 text-sm text-textMuted">
                          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Category</span>
                          <input
                            list="vault-categories"
                            className="focus-ring surface-field rounded-md px-3 py-2.5 text-sm text-textPrimary transition-colors duration-200 placeholder:text-textMuted/70 focus:border-textPrimary/60"
                            placeholder="Choose or create a category"
                            {...form.register('category')}
                          />
                          <datalist id="vault-categories">
                            {categories.map((category) => (
                              <option key={category} value={category} />
                            ))}
                          </datalist>
                        </label>
                      </section>

                      <section className="space-y-3 border-t border-line pt-5">
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Notes</p>
                        <Textarea
                          label="Secure notes"
                          placeholder="Recovery steps, context, internal documentation."
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

                      <section className="space-y-3 border-t border-line pt-5">
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Dual approval</p>
                        <Toggle
                          label="Require a second user to approve access"
                          checked={dualApprovalEnabled}
                          onChange={(value) =>
                            form.setValue('requiresDualApproval', value, { shouldDirty: true, shouldValidate: true })
                          }
                        />
                        {dualApprovalEnabled ? (
                          <Input
                            label="Second approver email"
                            placeholder="teammate@company.com"
                            error={form.formState.errors.secondApproverEmail?.message}
                            hint="They will receive an approval email before sensitive content can be opened."
                            {...form.register('secondApproverEmail')}
                          />
                        ) : null}
                      </section>

                      <section className="space-y-3 border-t border-line pt-5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-textMuted" />
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Attachments</p>
                        </div>
                        <FileUpload
                          files={files}
                          onChange={setFiles}
                          existingFiles={entry?.filePath}
                          entryId={entry?._id}
                        />
                      </section>
                    </div>

                    <div className="sticky bottom-0 grid gap-2 border-t border-line bg-panel px-4 py-3 sm:flex sm:items-center sm:justify-end sm:px-6">
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
