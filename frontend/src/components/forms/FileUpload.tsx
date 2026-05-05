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
          'focus-ring flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-4 py-5 text-center transition sm:min-h-[140px] sm:py-6',
          dragging ? 'border-brand bg-brand-light' : 'border-line bg-surface-soft hover:border-brand/40 hover:bg-surface-raised'
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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised text-brand shadow-sm">
          {dragging ? <UploadCloud className="h-6 w-6" /> : <Paperclip className="h-6 w-6" />}
        </div>
        <div>
          <p className="text-sm font-medium text-textPrimary">Drag and drop files here</p>
          <p className="mt-1 text-xs text-textMuted">or click to browse uploads</p>
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
            className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-soft px-3 py-2 text-sm transition hover:border-brand/40 hover:bg-surface-raised"
          >
            <span className="flex min-w-0 items-center gap-2 truncate text-textPrimary">
              <FileText className="h-4 w-4 text-brand" />
              <span className="truncate">{`Saved attachment ${index + 1}`}</span>
            </span>
            <span className="flex items-center gap-1 text-xs text-textMuted">
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>
        ))}

        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-soft px-3 py-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-textPrimary">
              <FileText className="h-4 w-4 text-brand" />
              <span className="truncate">{file.name}</span>
            </span>
            <button
              type="button"
              className="focus-ring rounded-full p-1 text-textMuted transition hover:text-danger"
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
