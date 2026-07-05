import { FormEvent, useEffect, useState } from 'react';

import { ButtonLoading } from '@/components/button-loading';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SearchCreatingDialogProps = {
  open: boolean;
  initialName?: string;
  loading?: boolean;
  onCancel: () => void;
  onOk: (name: string) => void;
};

export function SearchCreatingDialog({
  open,
  initialName,
  loading,
  onCancel,
  onOk,
}: SearchCreatingDialogProps) {
  const [name, setName] = useState(initialName || '');

  useEffect(() => {
    setName(initialName || '');
  }, [initialName, open]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim()) {
      onOk(name.trim());
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialName ? 'Rename Search App' : 'Create Search App'}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="search-name">Name</Label>
            <Input
              id="search-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <ButtonLoading type="submit" disabled={!name.trim()} loading={loading}>
              Confirm
            </ButtonLoading>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
