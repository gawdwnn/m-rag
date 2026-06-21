import api from '@/utils/api';
import { getAuthorization } from '@/utils/authorization-util';

export async function downloadDatasetDocument({
  datasetId,
  docId,
}: {
  datasetId: string;
  docId: string;
}) {
  const headers = new Headers();
  const authorization = getAuthorization();
  if (authorization) {
    headers.set('Authorization', authorization);
  }
  const response = await fetch(api.getDatasetDocumentFileDownload(datasetId, docId), {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Download failed with ${response.status}`);
  }
  return response.blob();
}
