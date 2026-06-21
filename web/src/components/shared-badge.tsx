import { Badge } from '@/components/ui/badge';

export function SharedBadge({ children }: { children?: string }) {
  if (!children) {
    return null;
  }

  return (
    <Badge variant="outline" className="max-w-[120px] truncate font-normal">
      {children}
    </Badge>
  );
}
