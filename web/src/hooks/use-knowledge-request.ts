import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CreateKnowledgebaseInput,
  Knowledgebase,
  UpdateKnowledgebaseInput,
} from '@/pages/datasets/types';
import {
  createKnowledgebase,
  deleteKnowledgebase,
  getKnowledgebase,
  listKnowledgebases,
  updateKnowledgebase,
} from '@/services/knowledge-service';
import { datasetQueryKey } from './use-user-setting-request';

export function useFetchKnowledgeList(enabled: boolean) {
  return useQuery({
    queryKey: datasetQueryKey,
    queryFn: listKnowledgebases,
    enabled,
    initialData: [] as Knowledgebase[],
  });
}

export function useFetchKnowledgeDetail(id: string | null) {
  return useQuery({
    queryKey: ['dataset', id],
    queryFn: () => getKnowledgebase(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateKnowledgebaseInput) => createKnowledgebase(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetQueryKey });
    },
  });
}

export function useUpdateKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateKnowledgebaseInput }) =>
      updateKnowledgebase(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetQueryKey });
    },
  });
}

export function useDeleteKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteKnowledgebase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetQueryKey });
    },
  });
}
