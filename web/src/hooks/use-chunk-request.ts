import { useQuery } from '@tanstack/react-query';

import type { ChunkListResponse } from '@/pages/datasets/types';
import { listDocumentChunks } from '@/services/knowledge-service';

export const documentChunksQueryKey = (
  datasetId: string | null,
  documentId: string | null,
) => ['document-chunks', datasetId, documentId];

export function useFetchDocumentChunks(
  datasetId: string | null,
  documentId: string | null,
) {
  return useQuery<ChunkListResponse>({
    queryKey: documentChunksQueryKey(datasetId, documentId),
    queryFn: () =>
      listDocumentChunks({
        datasetId: datasetId as string,
        documentId: documentId as string,
      }),
    enabled: Boolean(datasetId && documentId),
    initialData: undefined,
  });
}
