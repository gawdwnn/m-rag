import { FormEvent, useEffect, useMemo, useState } from 'react';

import { ButtonLoading } from '@/components/button-loading';
import { CrossLanguageFormField } from '@/components/cross-language-form-field';
import { FormContainer } from '@/components/form-container';
import { MetadataFilter } from '@/components/metadata-filter';
import { RerankFormFields } from '@/components/rerank';
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
import { UseKnowledgeGraphFormField } from '@/components/use-knowledge-graph-item';
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request';
import type { SearchApp, SearchConfig } from '@/pages/searches/types';
import { cn } from '@/lib/utils';

type SearchSettingProps = {
  search: SearchApp;
  loading?: boolean;
  onSave: (input: {
    name: string;
    description: string;
    search_config: Partial<SearchConfig>;
  }) => Promise<unknown>;
};

export function SearchSetting({ search, loading, onSave }: SearchSettingProps) {
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
  }, [search]);

  const selectedDatasets = useMemo(
    () => datasetsQuery.data.filter((dataset) => kbIds.includes(dataset.id)),
    [datasetsQuery.data, kbIds],
  );

  function onToggleDataset(datasetId: string, checked: boolean) {
    setKbIds((current) =>
      checked
        ? [...new Set([...current, datasetId])]
        : current.filter((id) => id !== datasetId),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
  }

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-r border-border-button bg-bg-card">
      <header className="border-b border-border-button px-5 py-4">
        <h2 className="text-base font-semibold">Setting</h2>
      </header>
      <form className="flex h-0 flex-1 flex-col" onSubmit={onSubmit}>
        <div className="h-0 flex-1 overflow-auto p-5">
          <FormContainer>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="search-app-name">Name</Label>
                <Input
                  id="search-app-name"
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="search-app-description">Description</Label>
                <Textarea
                  id="search-app-description"
                  value={description}
                  onChange={(event) => setDescription(event.currentTarget.value)}
                />
              </div>

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
              <RerankFormFields topK={topK} onTopKChange={setTopK} />
              <UseKnowledgeGraphFormField />
              <CrossLanguageFormField />
              <MetadataFilter />
            </div>
          </FormContainer>
        </div>
        <footer className="border-t border-border-button p-5">
          <ButtonLoading
            className="w-full"
            disabled={!name.trim() || kbIds.length === 0}
            loading={loading}
            type="submit"
          >
            Save
          </ButtonLoading>
        </footer>
      </form>
    </aside>
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
