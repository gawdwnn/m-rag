import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, FileText } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DocumentInfo } from '@/pages/datasets/types';
import { Routes } from '@/routes';
import { DatasetActionCell } from './dataset-action-cell';
import { ParseDropdownButton, ParsingStatusCell } from './parsing-status-cell';
import { formatDate } from './utils';

type UseDatasetTableColumnsProps = {
  onRun: (document: DocumentInfo) => void;
  onDelete: (document: DocumentInfo) => void;
  onSetStatus: (document: DocumentInfo, enabled: boolean) => void;
  showLog: (record: DocumentInfo) => void;
  runningDocumentId?: string | null;
  deletingDocumentId?: string | null;
  statusDocumentId?: string | null;
};

export function useDatasetTableColumns({
  onRun,
  onDelete,
  onSetStatus,
  showLog,
  runningDocumentId,
  deletingDocumentId,
  statusDocumentId,
}: UseDatasetTableColumnsProps) {
  const navigate = useNavigate();
  const columns: ColumnDef<DocumentInfo>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          Name
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            <ArrowUpDown className="size-4" />
          </Button>
        </div>
      ),
      meta: { cellClassName: 'max-w-[20vw]' },
      cell: ({ row }) => {
        const name = row.original.name;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-pointer items-center gap-2">
                <FileText className="size-4 shrink-0 text-text-secondary" />
                <button
                  type="button"
                  className="truncate text-left"
                  onClick={() =>
                    navigate(
                      `${Routes.ParsedResult}/chunks?id=${row.original.dataset_id}&doc_id=${row.original.id}`,
                    )
                  }
                >
                  {name}
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{name}</p>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'create_time',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          Upload date
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            <ArrowUpDown className="size-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <time className="lowercase" dateTime={new Date(row.original.create_time).toISOString()}>
          {formatDate(row.original.create_time || row.original.created_at)}
        </time>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Enabled',
      cell: ({ row }) => {
        const document = row.original;

        return (
          <Switch
            checked={document.status === '1'}
            disabled={statusDocumentId === document.id}
            onCheckedChange={(checked) => onSetStatus(document, checked)}
            aria-label={`Set ${document.name} status`}
          />
        );
      },
    },
    {
      accessorKey: 'chunk_count',
      header: 'Chunk number',
      cell: ({ row }) => <div className="capitalize">{row.original.chunk_count}</div>,
    },
    {
      accessorKey: 'run',
      header: 'Parse',
      cell: ({ row }) => <ParseDropdownButton record={row.original} />,
    },
    {
      id: 'run-status',
      header: '',
      cell: ({ row }) => (
        <ParsingStatusCell
          record={row.original}
          onRun={onRun}
          runningDocumentId={runningDocumentId}
          showLog={showLog}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      enableHiding: false,
      cell: ({ row }) => (
        <DatasetActionCell
          record={row.original}
          deletingDocumentId={deletingDocumentId}
          onDelete={onDelete}
        />
      ),
    },
  ];

  return columns;
}
