import type {
  CreateKnowledgebaseInput,
  DocumentListResponse,
  Knowledgebase,
  UpdateKnowledgebaseInput,
} from '@/pages/datasets/types';
import api from '@/utils/api';
import { request } from '@/utils/request';

const DATASETS_PATH = '/api/v1/datasets';

export async function listKnowledgebases(): Promise<Knowledgebase[]> {
  return request<Knowledgebase[]>(DATASETS_PATH);
}

export async function getKnowledgebase(id: string): Promise<Knowledgebase> {
  return request<Knowledgebase>(`${DATASETS_PATH}/${id}`);
}

export async function createKnowledgebase(input: CreateKnowledgebaseInput): Promise<Knowledgebase> {
  return request<Knowledgebase>(DATASETS_PATH, {
    method: 'POST',
    data: input,
  });
}

export async function updateKnowledgebase(
  id: string,
  input: UpdateKnowledgebaseInput,
): Promise<Knowledgebase> {
  return request<Knowledgebase>(`${DATASETS_PATH}/${id}`, {
    method: 'PUT',
    data: input,
  });
}

export async function deleteKnowledgebase(id: string): Promise<void> {
  await request<void>(DATASETS_PATH, {
    method: 'DELETE',
    data: { ids: [id] },
  });
}

export async function listDocument(datasetId: string): Promise<DocumentListResponse> {
  return request<DocumentListResponse>(`${DATASETS_PATH}/${datasetId}/documents`);
}

export async function uploadDocument(datasetId: string, files: File[]): Promise<DocumentListResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append('file', file));
  const docs = await request<DocumentListResponse['docs']>(`${DATASETS_PATH}/${datasetId}/documents`, {
    method: 'POST',
    data: formData,
  });
  return { docs, total: docs.length };
}

export async function documentIngest(input: {
  doc_ids: string[];
  run: number;
  delete?: boolean;
  apply_kb?: boolean;
}): Promise<{ success_count: number; errors?: string[] }> {
  return request(api.documentIngest, {
    method: 'POST',
    data: input,
  });
}

export async function parseDocument(
  datasetId: string,
  documentIds: string[],
): Promise<{ success_count: number; errors?: string[] }> {
  return request(api.documentParse(datasetId), {
    method: 'POST',
    data: { document_ids: documentIds },
  });
}

export async function stopDocumentParse(
  datasetId: string,
  documentIds: string[],
): Promise<{ success_count: number; errors?: string[] }> {
  return request(api.documentStop(datasetId), {
    method: 'POST',
    data: { document_ids: documentIds },
  });
}
