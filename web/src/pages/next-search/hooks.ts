import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type { RetrievalTestResponse } from '@/pages/datasets/types';
import type { SearchApp, SearchCompletionInput, UpdateSearchInput } from '@/pages/searches/types';
import {
  askSearch,
  getSearch,
  updateSearch,
} from '@/services/search-service';
import { searchListQueryKey } from '@/pages/next-searches/hooks';

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

const initialSearchData: RetrievalTestResponse & { isRuned: boolean } = {
  total: 0,
  chunks: [],
  doc_aggs: [],
  labels: [],
  isRuned: false,
};

export function useSearchCompletion(search?: SearchApp) {
  const [question, setQuestion] = useState('');
  const [filterValue, setFilterValue] = useState<{ doc_ids: string[] }>({ doc_ids: [] });
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const mutation = useMutation({
    mutationKey: ['searchCompletion', search?.id],
    mutationFn: (input: SearchCompletionInput) => askSearch(search?.id as string, input),
  });

  function run(next?: Partial<SearchCompletionInput>) {
    const nextPage = next?.page ?? page;
    if (next?.page) {
      setPage(next.page);
    }
    return mutation.mutateAsync({
      question,
      page: nextPage,
      size: pageSize,
      doc_ids: next?.doc_ids ?? filterValue.doc_ids,
    });
  }

  return {
    question,
    setQuestion,
    data: mutation.data ? { ...mutation.data, isRuned: true } : initialSearchData,
    loading: mutation.isPending,
    error: mutation.error,
    page,
    pageSize,
    filterValue,
    refetch: run,
    handleFilterSubmit: (docIds: string[]) => {
      setFilterValue({ doc_ids: docIds });
      setPage(1);
      void mutation.mutateAsync({
        question,
        page: 1,
        size: pageSize,
        doc_ids: docIds,
      });
    },
    onPaginationChange: (nextPage: number) => {
      setPage(nextPage);
      void mutation.mutateAsync({
        question,
        page: nextPage,
        size: pageSize,
        doc_ids: filterValue.doc_ids,
      });
    },
  };
}
