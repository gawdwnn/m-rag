import { Funnel } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FilterCollection } from './interface';

type FilterPopoverProps = PropsWithChildren<{
  filters: FilterCollection[];
  value: { doc_ids: string[] };
  onChange: (docIds: string[]) => void;
}>;

export function FilterPopover({
  children,
  filters,
  value,
  onChange,
}: FilterPopoverProps) {
  const fileFilter = filters.find((filter) => filter.field === 'doc_ids');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{fileFilter?.label ?? 'File'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={value.doc_ids.length === 0}
          onCheckedChange={() => onChange([])}
        >
          All files
        </DropdownMenuCheckboxItem>
        {fileFilter?.list.map((option) => (
          <DropdownMenuCheckboxItem
            checked={value.doc_ids.includes(option.id)}
            key={option.id}
            onCheckedChange={(checked) =>
              onChange(checked ? [option.id] : [])
            }
          >
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {typeof option.count === 'number' ? (
              <span className="ml-auto text-xs text-text-secondary">
                {option.count}
              </span>
            ) : null}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterButton() {
  return (
    <Button size="sm" type="button" variant="outline">
      <Funnel />
      Filter
    </Button>
  );
}
