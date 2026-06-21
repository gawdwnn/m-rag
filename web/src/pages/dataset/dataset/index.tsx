import { Plus } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { FileUploadDialog } from '@/components/file-upload-dialog';
import ListFilterBar from '@/components/list-filter-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useDeleteDocument,
  useFetchDocumentList,
  useRunDocument,
  useSetDocumentStatus,
} from '@/hooks/use-document-request';
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
  const deleteDocument = useDeleteDocument(datasetId);
  const setDocumentStatus = useSetDocumentStatus(datasetId);
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
      <Card className="mb-5 mr-5 min-w-[880px] bg-transparent shadow-none">
        <CardHeader className="space-y-0 p-5">
          <ListFilterBar
            className="items-end"
            leftPanel={
              <div>
                <h1 className="leading-normal font-medium">Files</h1>
                <p className="text-sm font-normal text-text-secondary">
                  Dataset documents
                </p>
              </div>
            }
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button">
                  <Plus />
                  Add file
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-auto min-w-40" align="end">
                <DropdownMenuItem onClick={showDocumentUploadModal}>
                  Upload file
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ListFilterBar>
        </CardHeader>

        <CardContent className="px-5 py-0">
          {documentsQuery.error instanceof Error ? (
            <p className="mb-3 rounded-md border border-destructive bg-state-error-5 px-3 py-2 text-sm font-medium text-destructive">
              {documentsQuery.error.message}
            </p>
          ) : null}

          <DatasetTable
            documents={documents}
            onRun={(document) => {
              const shouldCancel = document.run === '1' || document.run === '5';
              void runDocument.mutateAsync({
                documentIds: [document.id],
                run: shouldCancel ? 2 : 1,
                option:
                  document.run === '3'
                    ? { delete: true, apply_kb: false }
                    : undefined,
              });
            }}
            onDelete={(document) => {
              void deleteDocument.mutateAsync([document.id]);
            }}
            onSetStatus={(document, enabled) => {
              void setDocumentStatus.mutateAsync({
                documentIds: [document.id],
                status: enabled ? 1 : 0,
              });
            }}
            runningDocumentId={runDocument.isPending ? runDocument.variables?.documentIds[0] : null}
            deletingDocumentId={deleteDocument.isPending ? deleteDocument.variables?.[0] : null}
            statusDocumentId={setDocumentStatus.isPending ? setDocumentStatus.variables?.documentIds[0] : null}
          />
        </CardContent>

        {documentUploadVisible ? (
          <FileUploadDialog
            hideModal={hideDocumentUploadModal}
            onOk={onDocumentUploadOk}
            loading={documentUploadLoading}
            showParseOnCreation
          />
        ) : null}
      </Card>
    </main>
  );
}
