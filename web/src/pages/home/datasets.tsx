import { Database } from 'lucide-react';
import { useNavigate } from 'react-router';

import { EmptyAppCard } from '@/components/empty/empty';
import { EmptyCardType } from '@/components/empty/constant';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request';
import { Routes } from '@/routes';
import { DatasetCard } from '../datasets/dataset-list';
import { SeeAllAppCard } from './application-card';

export function Datasets() {
  const navigate = useNavigate();
  const datasetsQuery = useFetchKnowledgeList(true);
  const datasets = datasetsQuery.data ?? [];

  return (
    <section>
      <header>
        <h2 className="mb-2.5 flex items-center gap-2.5 text-2xl font-semibold leading-8">
          <Database className="size-6" />
          Datasets
        </h2>
      </header>

      {datasetsQuery.isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">
              Loading...
            </CardTitle>
          </CardHeader>
        </Card>
      ) : datasets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {datasets.slice(0, 6).map((dataset) => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              onSelect={(nextDataset) =>
                navigate(`${Routes.Dataset}/${nextDataset.id}`)
              }
            />
          ))}
          <SeeAllAppCard
            click={() => navigate(Routes.Datasets)}
          />
        </div>
      ) : (
        <EmptyAppCard
          type={EmptyCardType.Dataset}
          onClick={() => navigate(`${Routes.Datasets}?isCreate=true`)}
        />
      )}
    </section>
  );
}
