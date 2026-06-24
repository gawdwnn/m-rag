import { LoaderCircle } from 'lucide-react';
import { forwardRef } from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';

type ButtonLoadingProps = ButtonProps & {
  loading?: boolean;
};

export const ButtonLoading = forwardRef<HTMLButtonElement, ButtonLoadingProps>(
  ({ children, disabled, loading, ...props }, ref) => (
    <Button disabled={disabled || loading} ref={ref} {...props}>
      {loading ? <LoaderCircle className="animate-spin" /> : null}
      {children}
    </Button>
  ),
);

ButtonLoading.displayName = 'ButtonLoading';
