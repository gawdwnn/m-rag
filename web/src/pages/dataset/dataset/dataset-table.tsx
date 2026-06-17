import { CircleX, PlayCircle, RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DocumentInfo } from '@/pages/datasets/types';

type DatasetTableProps = {
  documents: DocumentInfo[];
  loading: boolean;
  onRefresh: () => void;
  onRun: (document: DocumentInfo) => void;
  runningDocumentId?: string | null;
};

export function DatasetTable({
  documents,
  loading,
  onRefresh,
  onRun,
  runningDocumentId,
}: DatasetTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-md border border-border-button bg-bg-base">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Files</h2>
          <p className="text-xs text-text-secondary">
            {documents.length} document{documents.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-bg-card text-left text-xs font-medium text-text-secondary">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Upload date</th>
              <th className="px-4 py-3">Enabled</th>
              <th className="px-4 py-3">Chunk number</th>
              <th className="px-4 py-3">Token number</th>
              <th className="px-4 py-3">Parse</th>
              <th className="px-4 py-3">Progress</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-text-secondary"
                >
                  No files in this dataset yet.
                </td>
              </tr>
            ) : (
              documents.map((document) => (
                <tr key={document.id} className="border-t" data-state={parseState(document.run)}>
                  <td className="max-w-[280px] px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {document.name}
                      </div>
                      <div className="truncate text-xs text-text-secondary">
                        {document.location}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                    {formatDate(document.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={document.status === '1' ? 'secondary' : 'outline'}
                    >
                      {document.status === '1' ? 'enabled' : 'disabled'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{document.chunk_count}</td>
                  <td className="px-4 py-3">{document.token_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={runningDocumentId === document.id}
                        onClick={() => onRun(document)}
                        aria-label={isParserRunning(document.run) ? 'Cancel parsing' : 'Parse document'}
                      >
                        {operationIcon(document)}
                      </Button>
                      <Badge variant={document.run === '0' ? 'outline' : 'secondary'}>
                        {parseState(document.run)}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="grid gap-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-bg-card">
                        <div
                          className="h-full bg-accent-primary"
                          style={{
                            width: `${progressPercent(document.progress)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary">
                        {progressPercent(document.progress)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function operationIcon(document: DocumentInfo) {
  if (isParserRunning(document.run)) {
    return <CircleX className="text-destructive" />;
  }
  if (document.run === '0') {
    return <PlayCircle className="text-accent-primary" />;
  }
  return <RotateCcw className="text-accent-primary" />;
}

function isParserRunning(run: string) {
  return run === '1' || run === '5';
}

function parseState(run: string) {
  const states: Record<string, string> = {
    '0': 'unstart',
    '1': 'running',
    '2': 'cancel',
    '3': 'done',
    '4': 'fail',
    '5': 'running',
  };
  return states[run] ?? 'unknown';
}

function progressPercent(progress: number) {
  return Math.round(Math.max(0, Math.min(1, progress)) * 100);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}
