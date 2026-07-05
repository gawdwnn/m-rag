import { Edit3, MoreHorizontal, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SearchApp } from '@/pages/searches/types';

type SearchDropdownProps = {
  search: SearchApp;
  onDelete: (search: SearchApp) => Promise<void>;
  onRename: (search: SearchApp) => void;
};

export function SearchDropdown({
  search,
  onDelete,
  onRename,
}: SearchDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
        <Button type="button" variant="ghost" size="icon">
          <MoreHorizontal />
          <span className="sr-only">Open search actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            onRename(search);
          }}
        >
          <Edit3 />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            void onDelete(search);
          }}
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
