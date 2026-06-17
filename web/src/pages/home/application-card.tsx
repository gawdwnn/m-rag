import { ChevronRight } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export type SeeAllAppCardProps = {
  click(): void;
};

export function SeeAllAppCard({ click }: SeeAllAppCardProps) {
  return (
    <Card className="min-h-[76px] cursor-pointer" onClick={click} tabIndex={0}>
      <CardContent className="flex size-full items-center justify-center gap-1.5 p-2.5 text-text-secondary">
        See all <ChevronRight className="size-4" />
      </CardContent>
    </Card>
  );
}
