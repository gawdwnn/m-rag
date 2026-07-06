import type {
  CreateSearchInput,
  SearchApp,
  SearchListResponse,
  UpdateSearchInput,
} from '@/pages/searches/types';
import api from '@/utils/api';
import { request } from '@/utils/request';

export async function createSearch(input: CreateSearchInput): Promise<{ search_id: string }> {
  return request(api.createSearch, {
    method: 'POST',
    data: input,
  });
}

export async function listSearches(params: {
  keywords?: string;
  page?: number;
  page_size?: number;
}): Promise<SearchListResponse> {
  return request<SearchListResponse>(api.getSearchList, { params });
}

export async function getSearch(searchId: string): Promise<SearchApp> {
  return request<SearchApp>(api.getSearchDetail(searchId));
}

export async function updateSearch(
  searchId: string,
  input: UpdateSearchInput,
): Promise<SearchApp> {
  return request<SearchApp>(api.updateSearchSetting(searchId), {
    method: 'PUT',
    data: input,
  });
}

export async function deleteSearch(searchId: string): Promise<boolean> {
  return request<boolean>(api.deleteSearch(searchId), {
    method: 'DELETE',
  });
}
