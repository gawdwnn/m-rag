import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DocumentInfo } from '@/pages/datasets/types';
import { formatBytes, formatDate, parseStatusStateMap } from './dataset/utils';

type ProcessLogModalProps = {
  title: string;
  visible: boolean;
  onCancel: () => void;
  logInfo: DocumentInfo | null;
};

export default function ProcessLogModal({
  title,
  visible,
  onCancel,
  logInfo,
}: ProcessLogModalProps) {
  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{logInfo?.name}</DialogDescription>
        </DialogHeader>

        {logInfo ? (
          <div className="grid gap-4 text-sm">
            <Info label="File type" value={logInfo.suffix || logInfo.type} />
            <Info label="Uploaded by" value={logInfo.created_by} />
            <Info label="Upload date" value={formatDate(logInfo.create_time || logInfo.created_at)} />
            <Info label="File size" value={formatBytes(logInfo.size)} />
            <Info label="Process begin" value={formatDate(logInfo.process_begin_at)} />
            <Info label="Duration" value={`${logInfo.process_duration.toFixed(2)}s`} />
            <Info label="Chunks" value={String(logInfo.chunk_count)} />
            <Info label="Tokens" value={String(logInfo.token_count)} />
            <Info label="Status" value={parseStatusStateMap[logInfo.run] ?? 'unknown'} />
            <div>
              <div className="mb-1 text-text-secondary">Details</div>
              <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md bg-bg-card p-3 text-text-primary">
                {logInfo.progress_msg || '-'}
              </pre>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <span className="text-text-secondary">{label}</span>
      <span className="min-w-0 truncate text-text-primary">{value || '-'}</span>
    </div>
  );
}
