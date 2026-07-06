export type Knowledgebase = {
  id: string;
  tenant_id: string;
  name: string;
  language: string;
  description: string;
  embedding_model: string;
  permission: 'me' | 'team';
  created_by: string;
  chunk_method: string;
  parser_config: Record<string, unknown>;
  document_count: number;
  token_num: number;
  chunk_count: number;
  status: string;
  avatar?: string;
  nickname?: string;
  tenant_avatar?: string;
  update_time?: number;
  created_at: string;
  updated_at: string;
};

export type DocumentInfo = {
  id: string;
  dataset_id: string;
  kb_id: string;
  name: string;
  location: string;
  size: number;
  type: string;
  suffix: string;
  source_type: string;
  chunk_method: string;
  parser_id: string;
  parser_config: Record<string, unknown>;
  token_num: number;
  token_count: number;
  chunk_num: number;
  chunk_count: number;
  progress: number;
  progress_msg: string;
  process_begin_at: string;
  process_duration: number;
  run: string;
  status: string;
  create_time: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DocumentListResponse = {
  docs: DocumentInfo[];
  total: number;
};

export type ChunkInfo = {
  id: string;
  content: string;
  document_id: string;
  docnm_kwd: string;
  important_keywords: string[];
  questions: string[];
  dataset_id: string;
  image_id: string;
  available: boolean;
  positions: unknown[];
  tag_kwd: string[];
  tag_feas: Record<string, unknown>;
};

export type ChunkListResponse = {
  total: number;
  chunks: ChunkInfo[];
  doc: DocumentInfo;
};

export type RetrievalChunk = {
  chunk_id: string;
  content_ltks: string;
  content_with_weight: string;
  doc_id: string;
  docnm_kwd: string;
  kb_id: string;
  important_kwd: string[];
  tag_kwd: string[];
  image_id: string;
  similarity: number;
  vector_similarity: number;
  term_similarity: number;
  positions: unknown[];
  doc_type_kwd: string;
  mom_id: string;
  row_id: string;
};

export type RetrievalDocumentAggregation = {
  doc_id: string;
  doc_name: string;
  count: number;
};

export type RetrievalTestInput = {
  dataset_ids?: string[];
  search_id?: string;
  question: string;
  page?: number;
  size?: number;
  top_k?: number;
  similarity_threshold?: number;
  vector_similarity_weight?: number;
  doc_ids?: string[];
  rerank_id?: string;
  use_kg?: boolean;
  keyword?: boolean;
  cross_languages?: string[];
  meta_data_filter?: {
    method?: string;
    logic?: string;
    manual?: Array<{
      key: string;
      op: string;
      value: string | string[];
    }>;
    semi_auto?: Array<string | { key: string; op?: string }>;
  };
};

export type RetrievalTestResponse = {
  total: number;
  chunks: RetrievalChunk[];
  doc_aggs: RetrievalDocumentAggregation[];
  documents: RetrievalDocumentAggregation[];
  labels: unknown[];
};

export type CreateKnowledgebaseInput = {
  name: string;
  embedding_model: string;
  chunk_method: string;
  parser_config?: Record<string, unknown>;
};

export type UpdateKnowledgebaseInput = Partial<
  Pick<
    Knowledgebase,
    | 'name'
    | 'description'
    | 'embedding_model'
    | 'permission'
    | 'chunk_method'
    | 'parser_config'
  >
>;

export type UserInfo = {
  id: string;
  nickname: string;
  email: string;
  avatar?: string;
  language: string;
  timezone?: string;
  access_token?: string;
  login_channel?: string | null;
  status?: string | null;
  is_active?: string;
  create_time?: number;
  update_time?: number;
};

export type TenantInfo = {
  tenant_id: string;
  llm_id: string;
  embd_id: string;
  parser_ids: string;
};
