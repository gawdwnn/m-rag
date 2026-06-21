import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useAuthenticatedBlob } from './hooks';

type UnsupportedPreviewerProps = {
  className?: string;
  url: string;
};

export function UnsupportedPreviewer({ className, url }: UnsupportedPreviewerProps) {
  const blobState = useAuthenticatedBlob(url);

  return (
    <div className={cn('grid h-full w-full place-items-center bg-bg-card p-5', className)}>
      {blobState.status === 'loading' ? (
        <div className="text-sm text-text-secondary">Loading...</div>
      ) : blobState.status === 'error' ? (
        <div className="text-sm text-state-error">{blobState.message}</div>
      ) : (
        <div className="grid gap-3 text-center">
          <p className="text-sm text-text-secondary">
            Preview is not implemented for this file type in the current slice.
          </p>
          <Button asChild>
            <a href={blobState.url} download>
              Download file
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
