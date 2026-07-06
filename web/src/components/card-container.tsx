import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

type CardContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function CardContainer({ children, className }: CardContainerProps) {
  return (
    <div
      className={cn(
        'grid auto-rows-auto content-start gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
