import { EmptyAppCard } from '@/components/empty/empty';
import { EmptyCardType } from '@/components/empty/constant';
import { HomeCard } from '@/components/home-card';
import { SharedBadge } from '@/components/shared-badge';
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
    <HomeCard
      data={{
        name: dataset.name,
        avatar: dataset.avatar,
        description: `${dataset.document_count} files`,
        update_time: dataset.update_time ?? dataset.updated_at,
      }}
      moreDropdown={
        onDelete ? <DatasetDropdown dataset={dataset} onDelete={onDelete} /> : null
      }
      sharedBadge={<SharedBadge>{dataset.nickname || dataset.created_by}</SharedBadge>}
      onClick={() => onSelect(dataset)}
    />
  );
}
