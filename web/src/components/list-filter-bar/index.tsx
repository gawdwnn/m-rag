import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ListFilterBarProps = PropsWithChildren<{
  leftPanel?: ReactNode;
  preChildren?: ReactNode;
  className?: string;
}>;

export default function ListFilterBar({
  children,
  preChildren,
  leftPanel,
  className,
}: ListFilterBarProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <h1 className="flex items-center gap-2.5 text-2xl font-semibold">
        {leftPanel}
      </h1>

      <div className="flex items-center gap-4" role="toolbar">
        {preChildren}
        {children}
      </div>
    </div>
  );
}
