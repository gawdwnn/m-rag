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
  run: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DocumentListResponse = {
  docs: DocumentInfo[];
  total: number;
};

export type CreateKnowledgebaseInput = {
  name: string;
  embedding_model: string;
  chunk_method: string;
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
