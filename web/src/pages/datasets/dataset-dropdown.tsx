import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Knowledgebase } from './types';

type DatasetDropdownProps = {
  dataset: Knowledgebase;
  onDelete: (dataset: Knowledgebase) => Promise<void>;
};

export function DatasetDropdown({ dataset, onDelete }: DatasetDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
        <Button type="button" variant="ghost" size="icon">
          <MoreHorizontal />
          <span className="sr-only">Open dataset actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            void onDelete(dataset);
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
