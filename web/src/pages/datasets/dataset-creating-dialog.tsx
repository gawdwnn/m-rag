import React from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateKnowledgebaseInput, TenantInfo } from './types';

const FORM_ID = 'dataset-creating-form';

type DatasetCreatingDialogProps = {
  tenantInfo: TenantInfo;
  hideModal: () => void;
  onOk: (input: CreateKnowledgebaseInput) => Promise<void>;
  loading: boolean;
};

export function DatasetCreatingDialog({
  tenantInfo,
  hideModal,
  onOk,
  loading,
}: DatasetCreatingDialogProps) {
  const [name, setName] = React.useState('');
  const [embeddingModel, setEmbeddingModel] = React.useState(tenantInfo.embd_id);
  const [chunkMethod, setChunkMethod] = React.useState('naive');

  React.useEffect(() => {
    setEmbeddingModel(tenantInfo.embd_id);
  }, [tenantInfo.embd_id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onOk({
      name,
      embedding_model: embeddingModel,
      chunk_method: chunkMethod,
    });
    hideModal();
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? hideModal() : undefined)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create dataset</DialogTitle>
        </DialogHeader>

        <form id={FORM_ID} className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="dataset-name">
              <span className="mr-1 text-destructive">*</span>
              Name
            </Label>
            <Input
              id="dataset-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Dataset name"
              maxLength={128}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dataset-embedding">Embedding model</Label>
            <Input
              id="dataset-embedding"
              value={embeddingModel}
              onChange={(event) => setEmbeddingModel(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Chunk method</Label>
            <Select value={chunkMethod} onValueChange={setChunkMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="naive">naive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form={FORM_ID} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
