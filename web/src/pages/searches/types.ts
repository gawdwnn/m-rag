import type { RetrievalTestInput, RetrievalTestResponse } from '@/pages/datasets/types';

export type SearchConfig = {
  kb_ids: string[];
  doc_ids: string[];
  similarity_threshold: number;
  vector_similarity_weight: number;
  top_k: number;
  rerank_id?: string;
  use_kg?: boolean;
  keyword?: boolean;
  summary?: boolean;
  chat_id?: string;
  llm_setting?: Record<string, unknown>;
  chat_settingcross_languages?: string[];
  highlight?: boolean;
  web_search?: boolean;
  related_search?: boolean;
  query_mindmap?: boolean;
};

export type SearchApp = {
  id: string;
  avatar?: string;
  tenant_id: string;
  name: string;
  description: string;
  created_by: string;
  search_config: SearchConfig;
  status?: string;
  create_time?: number;
  update_time?: number;
  created_at?: string;
  updated_at?: string;
  nickname?: string;
  tenant_avatar?: string;
};

export type SearchListResponse = {
  search_apps: SearchApp[];
  total: number;
};

export type CreateSearchInput = {
  name: string;
  description?: string;
  search_config?: Partial<SearchConfig>;
};

export type UpdateSearchInput = {
  name: string;
  description?: string;
  search_config: Partial<SearchConfig>;
};

export type SearchRetrievalInput = Pick<
  RetrievalTestInput,
  'question' | 'page' | 'size' | 'doc_ids'
>;
