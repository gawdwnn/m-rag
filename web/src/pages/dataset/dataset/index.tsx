import { Plus } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { FileUploadDialog } from '@/components/file-upload-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useFetchDocumentList, useRunDocument } from '@/hooks/use-document-request';
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request';
import { Routes } from '@/routes';
import { DatasetTable } from './dataset-table';
import { useHandleUploadDocument } from './use-upload-document';

export default function Dataset() {
  const { id: datasetId = null } = useParams();
  const datasetQuery = useFetchKnowledgeDetail(datasetId);
  const knowledgeBase = datasetQuery.data ?? null;
  const documentsQuery = useFetchDocumentList(datasetId);
  const runDocument = useRunDocument(datasetId);
  const {
    documentUploadLoading,
    documentUploadVisible,
    hideDocumentUploadModal,
    onDocumentUploadOk,
    showDocumentUploadModal,
  } = useHandleUploadDocument({ datasetId });

  if (datasetQuery.isLoading) {
    return (
      <main className="grid min-h-full place-items-center text-sm text-text-secondary">
        Loading...
      </main>
    );
  }

  if (!knowledgeBase) {
    return (
      <main className="grid min-h-full place-items-center px-5">
        <Card className="max-w-md">
          <CardHeader>
            <h1 className="text-base font-semibold">Dataset not found</h1>
            <Link className="text-sm text-accent-primary" to={Routes.Datasets}>
              Back to datasets
            </Link>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const documents = documentsQuery.data?.docs ?? [];

  return (
    <main className="min-h-0 overflow-auto px-5 pb-5">
      <Card className="bg-transparent shadow-none">
        <CardHeader className="flex-row items-end justify-between gap-4 space-y-0 px-0">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-medium">Files</h2>
              <Badge variant="secondary">{knowledgeBase.name}</Badge>
            </div>
            <p className="text-sm text-text-secondary">
              Files in this dataset are parsed before indexing.
            </p>
          </div>

          <div className="relative">
            <Button type="button" onClick={showDocumentUploadModal}>
              <Plus />
              Add file
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {documentsQuery.error instanceof Error ? (
            <p className="mb-3 rounded-md border border-destructive bg-state-error-5 px-3 py-2 text-sm font-medium text-destructive">
              {documentsQuery.error.message}
            </p>
          ) : null}

          <DatasetTable
            documents={documents}
            loading={documentsQuery.isFetching}
            onRefresh={() => void documentsQuery.refetch()}
            onRun={(document) => {
              void runDocument.mutateAsync({
                documentIds: [document.id],
                run: document.run === '1' || document.run === '5' ? 2 : 1,
                option:
                  document.run === '3'
                    ? { delete: true, apply_kb: false }
                    : undefined,
              });
            }}
            runningDocumentId={runDocument.isPending ? runDocument.variables?.documentIds[0] : null}
          />
        </CardContent>

        {documentUploadVisible ? (
          <FileUploadDialog
            hideModal={hideDocumentUploadModal}
            onOk={onDocumentUploadOk}
            loading={documentUploadLoading}
          />
        ) : null}
      </Card>
    </main>
  );
}
