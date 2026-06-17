import type { PropsWithChildren, ReactNode } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

type ProfileSettingWrapperCardProps = {
  header: ReactNode;
} & PropsWithChildren;

export function ProfileSettingWrapperCard({
  header,
  children,
}: ProfileSettingWrapperCardProps) {
  return (
    <Card className="flex w-full flex-col border bg-transparent shadow-none">
      <CardHeader className="border-b p-5">{header}</CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">{children}</CardContent>
    </Card>
  );
}
