import { useCallback, useState } from 'react';

import type { DocumentInfo } from '@/pages/datasets/types';

export function useShowLog() {
  const [logInfo, setLogInfo] = useState<DocumentInfo | null>(null);

  const showLog = useCallback((record: DocumentInfo) => {
    setLogInfo(record);
  }, []);

  const hideLog = useCallback(() => {
    setLogInfo(null);
  }, []);

  return {
    showLog,
    hideLog,
    logInfo,
    logVisible: Boolean(logInfo),
  };
}
