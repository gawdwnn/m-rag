import React from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type UploadFormSchemaType = {
  fileList: File[];
  parseOnCreation?: boolean;
};

type FileUploadDialogProps = {
  hideModal: () => void;
  onOk: (values: UploadFormSchemaType) => Promise<void> | void;
  loading?: boolean;
  showParseOnCreation?: boolean;
};

export function FileUploadDialog({
  hideModal,
  onOk,
  loading = false,
  showParseOnCreation = false,
}: FileUploadDialogProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [parseOnCreation, setParseOnCreation] = React.useState(false);
  const inputId = React.useId();
  const parseId = React.useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) {
      return;
    }
    await onOk({ fileList: files, parseOnCreation });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
      <section className="w-full max-w-xl rounded-lg border border-border-button bg-bg-base shadow-lg">
        <header className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Upload file</h2>
            <p className="text-sm text-text-secondary">
              Add local files to the selected dataset.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={hideModal}>
            <X />
            <span className="sr-only">Close</span>
          </Button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 px-5 py-5">
            {showParseOnCreation ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  id={parseId}
                  type="checkbox"
                  checked={parseOnCreation}
                  onChange={(event) => setParseOnCreation(event.target.checked)}
                />
                <span>Parse on creation</span>
              </label>
            ) : null}

            <label
              htmlFor={inputId}
              className="grid cursor-pointer gap-2 rounded-md border border-dashed border-border-button bg-bg-card px-4 py-8 text-center"
            >
              <span className="text-sm font-medium">
                Click to select files
              </span>
              <span className="text-xs text-text-secondary">
                TXT and Markdown files are accepted for the active parser path.
              </span>
              <Input
                id={inputId}
                type="file"
                multiple
                accept=".txt,.md"
                className="mx-auto max-w-sm bg-bg-base"
                onChange={(event) =>
                  setFiles(Array.from(event.currentTarget.files ?? []))
                }
              />
            </label>

            {files.length > 0 ? (
              <ul className="grid gap-2 text-sm">
                {files.map((file) => (
                  <li
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <span className="min-w-0 truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-text-secondary">
                      {file.size} bytes
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <footer className="flex justify-end gap-2 border-t px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={hideModal}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || files.length === 0}>
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
