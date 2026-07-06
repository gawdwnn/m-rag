import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PenLine, X } from 'lucide-react';

import { ButtonLoading } from '@/components/button-loading';
import { RAGAvatar } from '@/components/rag-avatar';
import {
  SimilaritySliderFormField,
  initialSimilarityThresholdValue,
  initialVectorSimilarityWeightValue,
} from '@/components/similarity-slider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request';
import type { SearchApp, SearchConfig } from '@/pages/searches/types';
import { cn } from '@/lib/utils';

type SearchSettingProps = {
  search: SearchApp;
  loading?: boolean;
  onClose: () => void;
  onSave: (input: {
    name: string;
    description: string;
    search_config: Partial<SearchConfig>;
  }) => Promise<unknown>;
};

export function SearchSetting({ search, loading, onClose, onSave }: SearchSettingProps) {
  const datasetsQuery = useFetchKnowledgeList(true);
  const [name, setName] = useState(search.name);
  const [description, setDescription] = useState(search.description || '');
  const [kbIds, setKbIds] = useState(search.search_config.kb_ids ?? []);
  const [similarityThreshold, setSimilarityThreshold] = useState(
    search.search_config.similarity_threshold ??
      initialSimilarityThresholdValue.similarity_threshold,
  );
  const [vectorSimilarityWeight, setVectorSimilarityWeight] = useState(
    search.search_config.vector_similarity_weight ??
      initialVectorSimilarityWeightValue.vector_similarity_weight,
  );
  const [topK, setTopK] = useState(search.search_config.top_k ?? 1024);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setName(search.name);
    setDescription(search.description || '');
    setKbIds(search.search_config.kb_ids ?? []);
    setSimilarityThreshold(
      search.search_config.similarity_threshold ??
        initialSimilarityThresholdValue.similarity_threshold,
    );
    setVectorSimilarityWeight(
      search.search_config.vector_similarity_weight ??
        initialVectorSimilarityWeightValue.vector_similarity_weight,
    );
    setTopK(search.search_config.top_k ?? 1024);
    setFormError('');
  }, [search]);

  const selectedDatasets = useMemo(
    () => datasetsQuery.data.filter((dataset) => kbIds.includes(dataset.id)),
    [datasetsQuery.data, kbIds],
  );

  function onToggleDataset(datasetId: string, checked: boolean) {
    setFormError('');
    setKbIds((current) =>
      checked
        ? [...new Set([...current, datasetId])]
        : current.filter((id) => id !== datasetId),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (kbIds.length === 0) {
      setFormError('Select at least one dataset before saving search settings.');
      return;
    }
    await onSave({
      name,
      description,
      search_config: {
        kb_ids: kbIds,
        doc_ids: [],
        similarity_threshold: similarityThreshold,
        vector_similarity_weight: vectorSimilarityWeight,
        top_k: topK,
        rerank_id: '',
        use_kg: false,
        keyword: false,
        summary: false,
        web_search: false,
        related_search: false,
        query_mindmap: false,
      },
    });
    onClose();
  }

  return (
    <aside className="flex h-full min-h-0 w-[440px] shrink-0 flex-col border-l border-border-button bg-bg-base p-4 text-text-primary">
      <header className="mb-8 flex shrink-0 items-center justify-between text-base">
        <h2 className="font-medium">Search settings</h2>
        <button onClick={onClose} type="button">
          <X className="cursor-pointer text-text-primary" size={16} />
          <span className="sr-only">Close search settings</span>
        </button>
      </header>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
        <div className="min-h-0 flex-1 overflow-y-auto p-1 pb-4 text-text-secondary scrollbar-auto">
          <div className="space-y-6">
            <SearchIdentityFields
              avatar={search.avatar}
              description={description}
              name={name}
              onDescriptionChange={setDescription}
              onNameChange={setName}
            />

            <DatasetSelector
              loading={datasetsQuery.isLoading}
              options={datasetsQuery.data}
              selectedIds={kbIds}
              selectedLabel={
                selectedDatasets.length
                  ? selectedDatasets.map((dataset) => dataset.name).join(', ')
                  : 'Select datasets'
              }
              onToggle={onToggleDataset}
            />

            <SimilaritySliderFormField
              similarityThreshold={similarityThreshold}
              vectorSimilarityWeight={vectorSimilarityWeight}
              onSimilarityThresholdChange={setSimilarityThreshold}
              onVectorSimilarityWeightChange={setVectorSimilarityWeight}
            />
            <TopKFormField topK={topK} onTopKChange={setTopK} />
          </div>
        </div>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-border-button bg-bg-base pt-3">
          {formError ? (
            <p className="mr-auto max-w-60 self-center text-xs text-state-error">
              {formError}
            </p>
          ) : null}
          <Button
            onClick={() => {
              setName(search.name);
              setDescription(search.description || '');
              setKbIds(search.search_config.kb_ids ?? []);
              onClose();
            }}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <ButtonLoading
            disabled={loading}
            loading={loading}
            type="submit"
          >
            OK
          </ButtonLoading>
        </footer>
      </form>
    </aside>
  );
}

function SearchIdentityFields({
  avatar,
  description,
  name,
  onDescriptionChange,
  onNameChange,
}: {
  avatar?: string;
  description: string;
  name: string;
  onDescriptionChange: (value: string) => void;
  onNameChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-3">
      <RAGAvatar avatar={avatar} className="size-12 rounded-lg" name={name} />
      <div className="min-w-0 flex-1 space-y-1 pt-1">
        <div className="flex items-center gap-1.5">
          <Input
            id="search-app-name"
            aria-label="Search App name"
            className="h-7 border-transparent bg-transparent px-0 py-0.5 text-base font-medium shadow-none focus-visible:ring-0"
            placeholder="Name"
            value={name}
            onChange={(event) => onNameChange(event.currentTarget.value)}
          />
          <PenLine className="size-3.5 shrink-0 text-text-secondary" />
        </div>
        <div className="flex items-start gap-1.5">
          <Textarea
            id="search-app-description"
            aria-label="Search App description"
            className="min-h-8 resize-none border-transparent bg-transparent px-0 py-0.5 text-sm text-text-secondary shadow-none focus-visible:ring-0"
            placeholder="Description"
            value={description}
            onChange={(event) => onDescriptionChange(event.currentTarget.value)}
          />
          <PenLine className="mt-1 size-3.5 shrink-0 text-text-secondary" />
        </div>
      </div>
    </div>
  );
}

function TopKFormField({
  topK,
  onTopKChange,
}: {
  topK: number;
  onTopKChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>Top-K</Label>
      <Input
        className="h-7 rounded-sm border-border-button bg-bg-input"
        max={2048}
        min={1}
        onChange={(event) => {
          const nextValue = Number(event.currentTarget.value);
          if (Number.isFinite(nextValue)) {
            onTopKChange(nextValue);
          }
        }}
        step={1}
        type="number"
        value={topK}
      />
    </div>
  );
}

function DatasetSelector({
  loading,
  options,
  selectedIds,
  selectedLabel,
  onToggle,
}: {
  loading: boolean;
  options: Array<{ id: string; name: string }>;
  selectedIds: string[];
  selectedLabel: string;
  onToggle: (datasetId: string, checked: boolean) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>Datasets</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={cn(
              'w-full justify-start overflow-hidden text-ellipsis whitespace-nowrap font-normal',
              selectedIds.length === 0 && 'text-text-secondary',
            )}
            type="button"
            variant="outline"
          >
            {loading ? 'Loading...' : selectedLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel>Datasets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.length ? (
            options.map((dataset) => (
              <DropdownMenuCheckboxItem
                key={dataset.id}
                checked={selectedIds.includes(dataset.id)}
                onCheckedChange={(checked) => onToggle(dataset.id, Boolean(checked))}
              >
                <span className="truncate">{dataset.name}</span>
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-text-secondary">
              No datasets available.
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
