import { CircleX, Play, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DocumentInfo } from '@/pages/datasets/types';
import {
  displayChunkMethod,
  isParserRunning,
  parseStatusStateMap,
  progressPercent,
  RunningStatus,
} from './utils';

type ParseDropdownButtonProps = {
  record: DocumentInfo;
};

export function ParseDropdownButton({ record }: ParseDropdownButtonProps) {
  const label = displayChunkMethod(record.chunk_method);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" className="h-auto px-0 capitalize">
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="capitalize">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

type ParsingStatusCellProps = {
  record: DocumentInfo;
  runningDocumentId?: string | null;
  onRun: (document: DocumentInfo) => void;
  showLog: (record: DocumentInfo) => void;
};

export function ParsingStatusCell({
  record,
  runningDocumentId,
  onRun,
  showLog,
}: ParsingStatusCellProps) {
  const running = isParserRunning(record.run);
  const percent = progressPercent(record.progress);

  return (
    <section
      className="flex items-center gap-8"
      data-testid="document-parse-status"
      data-state={parseStatusStateMap[record.run] ?? 'unknown'}
    >
      <div className="flex items-center gap-2">
        <Separator orientation="vertical" className="h-[1em]" />

        {running ? (
          <>
            <Button
              type="button"
              variant="ghost"
              className="h-auto min-w-24 justify-start gap-2 px-0"
              onClick={() => showLog(record)}
            >
              <Progress value={percent} className="h-1 min-w-10 flex-1" />
              <span className="text-xs text-text-secondary">{percent}%</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={runningDocumentId === record.id}
              onClick={() => onRun(record)}
              aria-label="Cancel parsing"
            >
              <CircleX className="size-[1em] text-state-error" />
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={runningDocumentId === record.id}
              onClick={() => onRun(record)}
              aria-label={record.run === RunningStatus.Unstart ? 'Parse document' : 'Reparse document'}
            >
              {record.run === RunningStatus.Unstart ? (
                <Play className="size-[1em] text-accent-primary" />
              ) : (
                <RotateCcw className="size-[1em] text-accent-primary" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-auto px-0 text-text-secondary"
              onClick={() => showLog(record)}
            >
              {parseStatusStateMap[record.run] ?? 'unknown'}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
