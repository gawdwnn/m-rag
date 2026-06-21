import { Download, Eye, Trash2 } from 'lucide-react';

import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import type { DocumentInfo } from '@/pages/datasets/types';
import { downloadDatasetDocument } from '@/services/file-manager-service';
import { downloadFileFromBlob, getExtension } from '@/utils/file-util';
import { isParserRunning } from './utils';

type DatasetActionCellProps = {
  record: DocumentInfo;
  deletingDocumentId?: string | null;
  onDelete: (document: DocumentInfo) => void;
};

export function DatasetActionCell({
  record,
  deletingDocumentId,
  onDelete,
}: DatasetActionCellProps) {
  const disabled = isParserRunning(record.run) || deletingDocumentId === record.id;
  const previewUrl = `/document/${record.id}?ext=${getExtension(record.name)}`;

  const onDownloadDocument = async () => {
    const blob = await downloadDatasetDocument({
      datasetId: record.dataset_id,
      docId: record.id,
    });
    downloadFileFromBlob(blob, record.name);
  };

  return (
    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={disabled}
        onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
        aria-label="Preview document"
      >
        <Eye className="size-[1em]" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={disabled}
        onClick={() => void onDownloadDocument()}
        aria-label="Download document"
      >
        <Download className="size-[1em]" />
      </Button>

      <ConfirmDeleteDialog name={record.name} disabled={disabled} onOk={() => onDelete(record)}>
        <Button
          data-testid="document-delete"
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={disabled}
          aria-label="Delete document"
        >
          <Trash2 className="size-[1em]" />
        </Button>
      </ConfirmDeleteDialog>
    </div>
  );
}
