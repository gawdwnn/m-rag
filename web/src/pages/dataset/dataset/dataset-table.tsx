import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import Empty from '@/components/empty/empty';
import { EmptyType } from '@/components/empty/constant';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DocumentInfo } from '@/pages/datasets/types';
import ProcessLogModal from '../process-log-modal';
import { useShowLog } from './hooks';
import { useDatasetTableColumns } from './use-dataset-table-columns';

type DatasetTableProps = {
  documents: DocumentInfo[];
  onRun: (document: DocumentInfo) => void;
  onDelete: (document: DocumentInfo) => void;
  onSetStatus: (document: DocumentInfo, enabled: boolean) => void;
  runningDocumentId?: string | null;
  deletingDocumentId?: string | null;
  statusDocumentId?: string | null;
};

export function DatasetTable({
  documents,
  onRun,
  onDelete,
  onSetStatus,
  runningDocumentId,
  deletingDocumentId,
  statusDocumentId,
}: DatasetTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const { showLog, logInfo, logVisible, hideLog } = useShowLog();

  const columns = useDatasetTableColumns({
    onRun,
    onDelete,
    onSetStatus,
    showLog,
    runningDocumentId,
    deletingDocumentId,
    statusDocumentId,
  });

  const table = useReactTable({
    data: documents,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="w-full">
      <Table rootClassName="max-h-[calc(100vh-222px)]">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="relative">
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-testid="document-row"
                data-doc-name={row.original.name}
                className="group"
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as
                    | { cellClassName?: string }
                    | undefined;

                  return (
                    <TableCell key={cell.id} className={meta?.cellClassName}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <Empty type={EmptyType.Data} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {logVisible ? (
        <ProcessLogModal
          title="File logs"
          visible={logVisible}
          onCancel={hideLog}
          logInfo={logInfo}
        />
      ) : null}
    </div>
  );
}
