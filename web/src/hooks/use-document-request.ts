import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { DocumentListResponse } from '@/pages/datasets/types';
import { listDocument, uploadDocument } from '@/services/knowledge-service';
import { datasetQueryKey } from './use-user-setting-request';

export const documentQueryKey = (datasetId: string | null) => ['documents', datasetId];

export function useFetchDocumentList(datasetId: string | null) {
  return useQuery<DocumentListResponse>({
    queryKey: documentQueryKey(datasetId),
    queryFn: () => listDocument(datasetId as string),
    enabled: Boolean(datasetId),
    initialData: { docs: [], total: 0 },
  });
}

export function useUploadDocument(datasetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => uploadDocument(datasetId as string, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKey(datasetId) });
      queryClient.invalidateQueries({ queryKey: datasetQueryKey });
    },
  });
}
