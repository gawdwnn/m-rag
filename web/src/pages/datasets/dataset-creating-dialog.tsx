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
import { Switch } from '@/components/ui/switch';
import type { CreateKnowledgebaseInput, TenantInfo } from './types';

const FORM_ID = 'dataset-creating-form';
const DEFAULT_CHUNK_TOKEN_NUM = 128;
const DEFAULT_DELIMITER = '\n!?;。；！？';
const DEFAULT_LAYOUT_RECOGNIZE = 'DeepDOC';

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
  const parserOptions = React.useMemo(() => parseTenantParserIds(tenantInfo.parser_ids), [
    tenantInfo.parser_ids,
  ]);
  const [chunkMethod, setChunkMethod] = React.useState(parserOptions[0]?.value ?? 'naive');
  const [chunkTokenNum, setChunkTokenNum] = React.useState(DEFAULT_CHUNK_TOKEN_NUM);
  const [delimiter, setDelimiter] = React.useState(DEFAULT_DELIMITER);
  const [overlappedPercent, setOverlappedPercent] = React.useState(0);
  const [enableChildren, setEnableChildren] = React.useState(false);
  const [childrenDelimiter, setChildrenDelimiter] = React.useState('\n');
  const [layoutRecognize, setLayoutRecognize] = React.useState(DEFAULT_LAYOUT_RECOGNIZE);

  React.useEffect(() => {
    setEmbeddingModel(tenantInfo.embd_id);
  }, [tenantInfo.embd_id]);

  React.useEffect(() => {
    if (!parserOptions.some((option) => option.value === chunkMethod)) {
      setChunkMethod(parserOptions[0]?.value ?? 'naive');
    }
  }, [chunkMethod, parserOptions]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onOk({
      name,
      embedding_model: embeddingModel,
      chunk_method: chunkMethod,
      parser_config: {
        chunk_token_num: chunkTokenNum,
        delimiter,
        overlapped_percent: overlappedPercent,
        enable_children: enableChildren,
        children_delimiter: enableChildren ? childrenDelimiter : '',
        layout_recognize: layoutRecognize,
      },
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
                {parserOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 rounded border border-border-button p-3">
            <div className="grid gap-2">
              <Label htmlFor="parser-chunk-token-num">Max token number</Label>
              <Input
                id="parser-chunk-token-num"
                type="number"
                min={1}
                max={4096}
                value={chunkTokenNum}
                onChange={(event) =>
                  setChunkTokenNum(Math.max(1, Number(event.target.value) || DEFAULT_CHUNK_TOKEN_NUM))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="parser-delimiter">Delimiter</Label>
              <Input
                id="parser-delimiter"
                value={delimiter}
                onChange={(event) => setDelimiter(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="parser-overlap">Overlap percent</Label>
              <Input
                id="parser-overlap"
                type="number"
                min={0}
                max={90}
                value={overlappedPercent}
                onChange={(event) =>
                  setOverlappedPercent(Math.max(0, Math.min(90, Number(event.target.value) || 0)))
                }
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="parser-enable-children">Child chunks</Label>
              <Switch
                id="parser-enable-children"
                checked={enableChildren}
                onCheckedChange={setEnableChildren}
              />
            </div>

            {enableChildren ? (
              <div className="grid gap-2">
                <Label htmlFor="parser-children-delimiter">Child delimiter</Label>
                <Input
                  id="parser-children-delimiter"
                  value={childrenDelimiter}
                  onChange={(event) => setChildrenDelimiter(event.target.value)}
                />
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label>Layout recognition</Label>
              <Select value={layoutRecognize} onValueChange={setLayoutRecognize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DeepDOC">DeepDOC</SelectItem>
                  <SelectItem value="Plain Text">Plain Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

function parseTenantParserIds(parserIds: string) {
  const values = parserIds
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueValues = values.length > 0 ? Array.from(new Set(values)) : ['naive'];
  return uniqueValues.map((value) => ({
    value,
    label: displayParserId(value),
  }));
}

function displayParserId(value: string) {
  return value === 'naive' ? 'general' : value.replaceAll('_', ' ');
}
