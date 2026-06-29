import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

type RAGPaginationProps = {
  total: number;
  current: number;
  pageSize: number;
  onChange: (page: number) => void;
};

export function RAGPagination({
  total,
  current,
  pageSize,
  onChange,
}: RAGPaginationProps) {
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  if (pageCount <= 1) {
    return null;
  }

  return (
    <footer className="flex items-center justify-end gap-2 border-t border-border-button px-5 py-3">
      <Button
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
        size="sm"
        type="button"
        variant="outline"
      >
        <ChevronLeft />
        Previous
      </Button>
      <span className="min-w-20 text-center text-sm text-text-secondary">
        {current} / {pageCount}
      </span>
      <Button
        disabled={current >= pageCount}
        onClick={() => onChange(current + 1)}
        size="sm"
        type="button"
        variant="outline"
      >
        Next
        <ChevronRight />
      </Button>
    </footer>
  );
}
