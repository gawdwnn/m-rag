import type { ReactNode } from 'react';

import { RAGFlowAvatar } from '@/components/ragflow-avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type HomeCardProps = {
  data: {
    name: string;
    description?: string;
    avatar?: string;
    update_time?: string | number;
  };
  moreDropdown?: ReactNode;
  sharedBadge?: ReactNode;
  onClick?: () => void;
};

export function HomeCard({ data, moreDropdown, sharedBadge, onClick }: HomeCardProps) {
  return (
    <Card
      onClick={onClick}
      tabIndex={0}
      className="group flex h-full w-full cursor-pointer items-start gap-2 px-2.5 py-4 transition-shadow hover:shadow-md"
    >
      <RAGFlowAvatar className="size-8" avatar={data.avatar} name={data.name} />

      <div className="w-0 flex-1">
        <CardHeader className="flex-row items-center gap-2 space-y-0 p-0">
          <CardTitle className="inline-flex w-0 flex-1">
            <h3 className="flex-1 truncate text-base font-bold leading-snug">
              {data.name}
            </h3>
          </CardTitle>
          {moreDropdown ? <div>{moreDropdown}</div> : null}
        </CardHeader>

        <CardContent className="p-0">
          <div className="mt-1 flex w-[calc(100%-50px)] flex-col gap-1">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              {data.description}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="whitespace-nowrap text-sm text-text-secondary">
                {formatTime(data.update_time)}
              </p>
              {sharedBadge}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function formatTime(value?: string | number) {
  if (!value) {
    return '';
  }
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}
