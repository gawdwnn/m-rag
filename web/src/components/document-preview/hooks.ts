import { useEffect, useState } from 'react';

import { getAuthorization } from '@/utils/authorization-util';

type BlobState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; blob: Blob; url: string };

export function useAuthenticatedBlob(url: string) {
  const [state, setState] = useState<BlobState>({ status: 'loading' });

  useEffect(() => {
    if (!url) {
      setState({ status: 'error', message: 'Preview url is required.' });
      return;
    }

    let objectUrl: string | undefined;
    const headers = new Headers();
    const authorization = getAuthorization();
    if (authorization) {
      headers.set('Authorization', authorization);
    }

    setState({ status: 'loading' });
    fetch(url, { headers })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Preview failed with ${response.status}`);
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setState({ status: 'ready', blob, url: objectUrl });
      })
      .catch((error: unknown) => {
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Preview failed.',
        });
      });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);

  return state;
}
