import { cn } from '@/lib/utils';

import { useAuthenticatedBlob } from './hooks';

type PdfPreviewerProps = {
  className?: string;
  url: string;
};

export function PdfPreviewer({ className, url }: PdfPreviewerProps) {
  const blobState = useAuthenticatedBlob(url);

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-bg-card', className)}>
      {blobState.status === 'loading' ? (
        <div className="p-5 text-sm text-text-secondary">Loading...</div>
      ) : blobState.status === 'error' ? (
        <div className="p-5 text-sm text-state-error">{blobState.message}</div>
      ) : (
        <iframe title="Document preview" src={blobState.url} className="h-full w-full" />
      )}
    </div>
  );
}
