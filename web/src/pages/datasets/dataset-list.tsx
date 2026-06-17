import { Badge } from '@/components/ui/badge';
import { EmptyAppCard } from '@/components/empty/empty';
import { EmptyCardType } from '@/components/empty/constant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatasetDropdown } from './dataset-dropdown';
import type { Knowledgebase } from './types';

type DatasetListProps = {
  datasets: Knowledgebase[];
  isLoading: boolean;
  onCreate: () => void;
  onSelect: (dataset: Knowledgebase) => void;
  onDelete: (dataset: Knowledgebase) => Promise<void>;
};

export function DatasetList({
  datasets,
  isLoading,
  onCreate,
  onSelect,
  onDelete,
}: DatasetListProps) {
  if (isLoading) {
    return <p className="px-5 text-sm text-text-secondary">Loading...</p>;
  }

  if (datasets.length === 0) {
    return (
      <section className="flex flex-1 items-center justify-center px-5" data-testid="datasets-list">
        <EmptyAppCard
          showIcon
          size="large"
          className="w-[480px] p-14"
          type={EmptyCardType.Dataset}
          onClick={onCreate}
        />
      </section>
    );
  }

  return (
    <section className="grid flex-1 grid-cols-1 gap-4 overflow-auto px-5 pb-5 sm:grid-cols-2 xl:grid-cols-3">
      {datasets.map((dataset) => (
        <DatasetCard
          key={dataset.id}
          dataset={dataset}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}

export function DatasetCard({
  dataset,
  onSelect,
  onDelete,
}: {
  dataset: Knowledgebase;
  onSelect: (dataset: Knowledgebase) => void;
  onDelete?: (dataset: Knowledgebase) => Promise<void>;
}) {
  return (
    <Card
      className="h-full cursor-pointer px-2.5 py-4 transition-shadow hover:shadow-md"
      onClick={() => onSelect(dataset)}
      tabIndex={0}
    >
      <CardHeader className="flex-row items-start gap-3 space-y-0 p-0">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-bg-card text-sm font-semibold">
          {dataset.name.slice(0, 1).toUpperCase()}
        </div>
        <CardTitle className="min-w-0 flex-1 truncate text-base">
          {dataset.name}
        </CardTitle>
        {onDelete ? <DatasetDropdown dataset={dataset} onDelete={onDelete} /> : null}
      </CardHeader>
      <CardContent className="p-0 pt-3">
        <div className="grid gap-2 text-sm text-text-secondary">
          <p>{dataset.document_count} files</p>
          <div className="flex items-center justify-between gap-3">
            <span className="truncate">{dataset.updated_at}</span>
            <Badge variant="outline">{dataset.created_by}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
