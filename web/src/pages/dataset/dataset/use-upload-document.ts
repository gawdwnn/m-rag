import React from 'react';

import type { UploadFormSchemaType } from '@/components/file-upload-dialog';
import { useRunDocument, useUploadDocument } from '@/hooks/use-document-request';

type UseHandleUploadDocumentProps = {
  datasetId: string | null;
};

export function useHandleUploadDocument({
  datasetId,
}: UseHandleUploadDocumentProps) {
  const [documentUploadVisible, setDocumentUploadVisible] =
    React.useState(false);
  const uploadMutation = useUploadDocument(datasetId);
  const runDocument = useRunDocument(datasetId);

  const showDocumentUploadModal = React.useCallback(() => {
    setDocumentUploadVisible(true);
  }, []);

  const hideDocumentUploadModal = React.useCallback(() => {
    setDocumentUploadVisible(false);
  }, []);

  const onDocumentUploadOk = React.useCallback(
    async ({ fileList, parseOnCreation }: UploadFormSchemaType) => {
      if (!datasetId || fileList.length === 0) {
        return;
      }
      const result = await uploadMutation.mutateAsync(fileList);
      if (parseOnCreation && result.docs.length > 0) {
        await runDocument.mutateAsync({
          documentIds: result.docs.map((document) => document.id),
          run: 1,
        });
      }
      hideDocumentUploadModal();
    },
    [datasetId, hideDocumentUploadModal, runDocument, uploadMutation],
  );

  return {
    documentUploadLoading: uploadMutation.isPending || runDocument.isPending,
    documentUploadVisible,
    hideDocumentUploadModal,
    onDocumentUploadOk,
    showDocumentUploadModal,
  };
}
