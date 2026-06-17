import React from 'react';

import type { UploadFormSchemaType } from '@/components/file-upload-dialog';
import { useUploadDocument } from '@/hooks/use-document-request';

type UseHandleUploadDocumentProps = {
  datasetId: string | null;
};

export function useHandleUploadDocument({
  datasetId,
}: UseHandleUploadDocumentProps) {
  const [documentUploadVisible, setDocumentUploadVisible] =
    React.useState(false);
  const uploadMutation = useUploadDocument(datasetId);

  const showDocumentUploadModal = React.useCallback(() => {
    setDocumentUploadVisible(true);
  }, []);

  const hideDocumentUploadModal = React.useCallback(() => {
    setDocumentUploadVisible(false);
  }, []);

  const onDocumentUploadOk = React.useCallback(
    async ({ fileList }: UploadFormSchemaType) => {
      if (!datasetId || fileList.length === 0) {
        return;
      }
      await uploadMutation.mutateAsync(fileList);
      hideDocumentUploadModal();
    },
    [datasetId, hideDocumentUploadModal, uploadMutation],
  );

  return {
    documentUploadLoading: uploadMutation.isPending,
    documentUploadVisible,
    hideDocumentUploadModal,
    onDocumentUploadOk,
    showDocumentUploadModal,
  };
}
