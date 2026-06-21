import { cn } from '@/lib/utils';

import { useAuthenticatedBlob } from './hooks';

type ImagePreviewerProps = {
  className?: string;
  url: string;
};

export function ImagePreviewer({ className, url }: ImagePreviewerProps) {
  const blobState = useAuthenticatedBlob(url);

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-auto bg-bg-card p-5',
        className,
      )}
    >
      {blobState.status === 'loading' ? (
        <div className="text-sm text-text-secondary">Loading...</div>
      ) : blobState.status === 'error' ? (
        <div className="text-sm text-state-error">{blobState.message}</div>
      ) : (
        <img src={blobState.url} alt="" className="max-h-full max-w-full object-contain" />
      )}
    </div>
  );
}
