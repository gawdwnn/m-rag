import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { useAuthenticatedBlob } from './hooks';

type TxtPreviewerProps = {
  className?: string;
  url: string;
};

export function TxtPreviewer({ className, url }: TxtPreviewerProps) {
  const blobState = useAuthenticatedBlob(url);
  const [text, setText] = useState('');

  useEffect(() => {
    if (blobState.status !== 'ready') {
      setText('');
      return;
    }

    blobState.blob.text().then(setText);
  }, [blobState]);

  return (
    <div className={cn('relative h-full w-full overflow-auto bg-bg-card p-5', className)}>
      {blobState.status === 'loading' ? (
        <div className="text-sm text-text-secondary">Loading...</div>
      ) : blobState.status === 'error' ? (
        <div className="text-sm text-state-error">{blobState.message}</div>
      ) : (
        <pre className="whitespace-pre-wrap text-sm leading-6 text-text-primary">{text}</pre>
      )}
    </div>
  );
}
