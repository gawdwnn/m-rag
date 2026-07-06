import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { RetrievalTestResponse } from '@/pages/datasets/types';
import type { SearchApp, SearchRetrievalInput, UpdateSearchInput } from '@/pages/searches/types';
import { retrievalTest } from '@/services/knowledge-service';
import { getSearch, updateSearch } from '@/services/search-service';
import { searchListQueryKey } from '@/pages/next-searches/hooks';
import {
  useSelectTestingResult,
} from '@/hooks/use-knowledge-request';

const emptyTestingResult: RetrievalTestResponse & { isRuned: boolean } = {
  total: 0,
  chunks: [],
  doc_aggs: [],
  documents: [],
  labels: [],
  isRuned: false,
};

export function useFetchSearchDetail(searchId?: string) {
  return useQuery({
    queryKey: ['search', searchId],
    queryFn: () => getSearch(searchId as string),
    enabled: Boolean(searchId),
  });
}

export function useUpdateSearchSetting(searchId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSearchInput) => updateSearch(searchId as string, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', searchId] });
      queryClient.invalidateQueries({ queryKey: searchListQueryKey });
    },
  });
}

function buildRetrievalInput(search: SearchApp | undefined, input: SearchRetrievalInput) {
  return {
    ...input,
    dataset_ids: search?.search_config.kb_ids ?? [],
    search_id: search?.id,
  };
}

export function useTestChunkRetrieval(search?: SearchApp) {
  const mutation = useMutation({
    mutationKey: ['testChunk'],
    gcTime: 0,
    mutationFn: async (input: SearchRetrievalInput) =>
      normalizeRetrievalResult(await retrievalTest(buildRetrievalInput(search, input))),
  });

  return {
    data: mutation.data ? { ...mutation.data, isRuned: true } : emptyTestingResult,
    error: mutation.error,
    loading: mutation.isPending,
    testChunk: mutation.mutateAsync,
  };
}

export function useTestChunkAllRetrieval(search?: SearchApp) {
  const mutation = useMutation({
    mutationKey: ['testChunkAll'],
    gcTime: 0,
    mutationFn: async (input: SearchRetrievalInput) =>
      normalizeRetrievalResult(await retrievalTest(buildRetrievalInput(search, {
        ...input,
        doc_ids: [],
      }))),
  });

  return {
    data: mutation.data ?? emptyTestingResult,
    error: mutation.error,
    loading: mutation.isPending,
    testChunkAll: mutation.mutateAsync,
  };
}

type SearchingProps = {
  searchText: string;
  data: SearchApp;
};

export function useSearching({
  searchText,
  data: searchData,
}: SearchingProps) {
  const { error, loading, testChunk: runTestChunk } = useTestChunkRetrieval(searchData);
  const {
    error: allError,
    testChunkAll,
  } = useTestChunkAllRetrieval(searchData);
  const data = useSelectTestingResult();
  const [filterValue, setFilterValue] = useState<{ doc_ids: string[] }>({ doc_ids: [] });
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const testChunk = useCallback((next?: Partial<SearchRetrievalInput> & { resetFilter?: boolean }) => {
    const nextPage = next?.page ?? page;
    if (next?.page) {
      setPage(next.page);
    }
    const docIds = next?.resetFilter ? [] : next?.doc_ids ?? filterValue.doc_ids;
    if (next?.resetFilter) {
      setFilterValue({ doc_ids: [] });
    }
    runTestChunk({
      question: searchText,
      page: nextPage,
      size: pageSize,
      doc_ids: docIds,
    });
  }, [filterValue.doc_ids, page, pageSize, runTestChunk, searchText]);

  const handleFilterSubmit = useCallback((docIds: string[]) => {
    setFilterValue({ doc_ids: docIds });
    setPage(1);
    const input = {
      question: searchText,
      page: 1,
      size: pageSize,
      doc_ids: docIds,
    };
    runTestChunk(input);
    testChunkAll(input);
  }, [pageSize, runTestChunk, searchText, testChunkAll]);

  const onPaginationChange = useCallback((nextPage: number) => {
    setPage(nextPage);
    runTestChunk({
      question: searchText,
      page: nextPage,
      size: pageSize,
      doc_ids: filterValue.doc_ids,
    });
  }, [filterValue.doc_ids, pageSize, runTestChunk, searchText]);

  return {
    data,
    loading,
    error: error ?? allError,
    page,
    pageSize,
    filterValue,
    setSelectedDocumentIds: (docIds: string[]) => setFilterValue({ doc_ids: docIds }),
    testChunk,
    handleFilterSubmit,
    onPaginationChange,
  };
}

function normalizeRetrievalResult(value: unknown): RetrievalTestResponse {
  const payload = value as Partial<RetrievalTestResponse> & {
    data?: Partial<RetrievalTestResponse>;
  };
  const result = Array.isArray(payload.chunks) ? payload : payload.data;
  const docAggs = Array.isArray(result?.doc_aggs) ? result.doc_aggs : [];
  return {
    total: Number(result?.total ?? 0),
    chunks: Array.isArray(result?.chunks) ? result.chunks : [],
    doc_aggs: docAggs,
    documents: Array.isArray(result?.documents) ? result.documents : docAggs,
    labels: Array.isArray(result?.labels) ? result.labels : [],
  };
}
