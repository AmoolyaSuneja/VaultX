import { ExternalLink, FileText, Paperclip, Trash2, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  existingFiles?: string[];
}

export function FileUpload({ files, onChange, existingFiles = [] }: FileUploadProps) {
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
        {existingFiles.map((file, index) => (
          <a
            key={file}
            href={file}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-muted"
          >
            <span className="flex min-w-0 items-center gap-2 truncate text-textPrimary">
              <FileText className="h-4 w-4 text-textMuted" />
              <span className="truncate">{`Saved attachment ${index + 1}`}</span>
            </span>
            <span className="flex items-center gap-1 text-xs text-textMuted">
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>
        ))}

        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-textPrimary">
              <FileText className="h-4 w-4 text-textMuted" />
              <span className="truncate">{file.name}</span>
            </span>
            <button
              type="button"
              className="focus-ring rounded-full p-1 text-textMuted transition-colors hover:text-danger"
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
