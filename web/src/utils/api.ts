const restAPIv1 = '/api/v1';

export { restAPIv1 };

export default {
  login: `${restAPIv1}/auth/login`,
  logout: `${restAPIv1}/auth/logout`,
  register: `${restAPIv1}/users`,
  setting: `${restAPIv1}/users/me`,
  userInfo: `${restAPIv1}/users/me`,
  tenantInfo: `${restAPIv1}/users/me/models`,
  documentIngest: `${restAPIv1}/documents/ingest`,
  documentParse: (datasetId: string) =>
    `${restAPIv1}/datasets/${datasetId}/documents/parse`,
  documentStop: (datasetId: string) =>
    `${restAPIv1}/datasets/${datasetId}/documents/stop`,
  documentDelete: (datasetId: string) =>
    `${restAPIv1}/datasets/${datasetId}/documents`,
  documentChangeStatus: (datasetId: string) =>
    `${restAPIv1}/datasets/${datasetId}/documents/batch-update-status`,
  documentChunks: (datasetId: string, documentId: string) =>
    `${restAPIv1}/datasets/${datasetId}/documents/${documentId}/chunks`,
  retrievalTest: `${restAPIv1}/datasets/search`,
  datasetRetrievalTest: (datasetId: string) => `${restAPIv1}/datasets/${datasetId}/search`,
  createSearch: `${restAPIv1}/searches`,
  getSearchList: `${restAPIv1}/searches`,
  deleteSearch: (searchId: string) => `${restAPIv1}/searches/${searchId}`,
  getSearchDetail: (searchId: string) => `${restAPIv1}/searches/${searchId}`,
  updateSearchSetting: (searchId: string) => `${restAPIv1}/searches/${searchId}`,
  searchCompletion: (searchId: string) =>
    `${restAPIv1}/searches/${searchId}/completions`,
  documentPreview: (documentId: string) =>
    `${restAPIv1}/documents/${documentId}/preview`,
  getDatasetDocumentFileDownload: (datasetId: string, documentId: string) =>
    `${restAPIv1}/datasets/${datasetId}/documents/${documentId}`,
};
