import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type {
  CreateKnowledgebaseInput,
  Knowledgebase,
  RetrievalTestInput,
  RetrievalTestResponse,
  UpdateKnowledgebaseInput,
} from '@/pages/datasets/types';
import {
  createKnowledgebase,
  deleteKnowledgebase,
  getKnowledgebase,
  listKnowledgebases,
  retrievalTest,
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

const initialRetrievalData: RetrievalTestResponse & { isRuned: boolean } = {
  total: 0,
  chunks: [],
  doc_aggs: [],
  labels: [],
  isRuned: false,
};

export function useTestRetrieval(datasetId: string | null) {
  const [values, setValues] = useState<RetrievalTestInput>({
    dataset_ids: datasetId ? [datasetId] : [],
    question: '',
    page: 1,
    size: 30,
    top_k: 1024,
    similarity_threshold: 0.2,
    vector_similarity_weight: 0.3,
    doc_ids: [],
  });
  const [filterValue, setFilterValue] = useState<{ doc_ids: string[] }>({ doc_ids: [] });
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const mutation = useMutation({
    mutationKey: ['testRetrieval', datasetId],
    mutationFn: async (nextValues?: Partial<RetrievalTestInput>) => {
      const payload = {
        ...values,
        ...nextValues,
        dataset_ids: datasetId ? [datasetId] : [],
        page: nextValues?.page ?? page,
        size: pageSize,
        doc_ids: nextValues?.doc_ids ?? filterValue.doc_ids,
      };
      return retrievalTest(payload, datasetId);
    },
  });

  return {
    data: mutation.data ? { ...mutation.data, isRuned: true } : initialRetrievalData,
    loading: mutation.isPending,
    error: mutation.error,
    values,
    setValues,
    filterValue,
    page,
    pageSize,
    refetch: (nextValues?: Partial<RetrievalTestInput>) => {
      if (nextValues?.page) {
        setPage(nextValues.page);
      }
      return mutation.mutateAsync(nextValues);
    },
    handleFilterSubmit: (docIds: string[]) => {
      setFilterValue({ doc_ids: docIds });
      setPage(1);
      void mutation.mutateAsync({ doc_ids: docIds, page: 1 });
    },
    onPaginationChange: (nextPage: number) => {
      setPage(nextPage);
      void mutation.mutateAsync({ page: nextPage });
    },
  };
}
