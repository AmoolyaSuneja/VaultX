import { FileText, Paperclip, Trash2, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { ProtectedAttachmentPreview } from '@/components/attachments/ProtectedAttachmentPreview';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  existingFiles?: string[];
  entryId?: string;
}

export function FileUpload({ files, onChange, existingFiles = [], entryId }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function pushFiles(nextFiles: FileList | null) {
    if (!nextFiles) return;
    onChange([...files, ...Array.from(nextFiles)]);
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        className={cn(
          'focus-ring flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-5 text-center transition-colors',
          dragging ? 'border-textPrimary bg-surface-muted' : 'border-line bg-surface hover:border-textPrimary/40'
        )}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          pushFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-textMuted">
          {dragging ? <UploadCloud className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-medium text-textPrimary">Drag and drop or click to browse</p>
          <p className="mt-0.5 text-xs text-textMuted">PDF, images, up to 10 files</p>
        </div>
        <input ref={inputRef} hidden type="file" multiple onChange={(event) => pushFiles(event.target.files)} />
      </button>

      <div className="grid gap-2">
        {existingFiles.map((file, index) =>
          entryId ? (
            <ProtectedAttachmentPreview
              key={`${file}-${index}`}
              compact
              label={`Saved attachment ${index + 1}`}
              fileUrl={file}
              previewEndpoint={`/api/vault/${entryId}/attachments/${index}/preview`}
              downloadEndpoint={`/api/vault/${entryId}/attachments/${index}/download`}
            />
          ) : (
            <div
              key={file}
              className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 truncate text-textPrimary">
                <FileText className="h-4 w-4 shrink-0 text-textMuted" />
                <span className="truncate">{`Saved attachment ${index + 1}`}</span>
              </span>
              <span className="shrink-0 text-xs text-textMuted">Save to preview</span>
            </div>
          )
        )}

        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-textPrimary">
              <FileText className="h-4 w-4 shrink-0 text-textMuted" />
              <span className="truncate">{file.name}</span>
            </span>
            <button
              type="button"
              className="focus-ring shrink-0 rounded-full p-1 text-textMuted transition-colors hover:text-danger"
              onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
              aria-label={`Remove ${file.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
