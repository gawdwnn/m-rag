import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type { CreateSearchInput, SearchApp } from '@/pages/searches/types';
import {
  createSearch,
  deleteSearch,
  listSearches,
  updateSearch,
} from '@/services/search-service';

export const searchListQueryKey = ['searches'];

export function useFetchSearchList() {
  const [searchString, setSearchString] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 30 });

  const query = useQuery({
    queryKey: [
      ...searchListQueryKey,
      searchString,
      pagination.page,
      pagination.pageSize,
    ],
    queryFn: () =>
      listSearches({
        keywords: searchString,
        page: pagination.page,
        page_size: pagination.pageSize,
      }),
    initialData: { search_apps: [], total: 0 },
  });

  return {
    ...query,
    searchString,
    pagination,
    handleInputChange: (value: string) => {
      setPagination((current) => ({ ...current, page: 1 }));
      setSearchString(value);
    },
    setPagination,
  };
}

export function useCreateSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSearchInput) => createSearch(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchListQueryKey });
    },
  });
}

export function useUpdateSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      search,
      name,
    }: {
      search: SearchApp;
      name: string;
    }) =>
      updateSearch(search.id, {
        name,
        description: search.description,
        search_config: search.search_config,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: searchListQueryKey });
      queryClient.invalidateQueries({ queryKey: ['search', variables.search.id] });
    },
  });
}

export function useDeleteSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (searchId: string) => deleteSearch(searchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchListQueryKey });
    },
  });
}
