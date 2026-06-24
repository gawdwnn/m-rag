import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

type FormContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function FormContainer({ children, className }: FormContainerProps) {
  return (
    <section
      className={cn(
        'rounded-md border border-border-button bg-bg-card',
        className,
      )}
    >
      {children}
    </section>
  );
}
