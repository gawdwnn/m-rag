import React from 'react';
import { Database, Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

import ListFilterBar from '@/components/list-filter-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  useCreateKnowledge,
  useDeleteKnowledge,
  useFetchKnowledgeList,
} from '@/hooks/use-knowledge-request';
import { useFetchTenantInfo, useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { Routes } from '@/routes';
import { DatasetCreatingDialog } from './dataset-creating-dialog';
import { DatasetList } from './dataset-list';

export function DatasetPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createVisible, setCreateVisible] = React.useState(false);
  const userQuery = useFetchUserInfo();
  const userInfo = userQuery.data ?? null;
  const tenantQuery = useFetchTenantInfo(Boolean(userInfo));
  const tenantInfo = tenantQuery.data ?? null;
  const canFetchDatasets = Boolean(userInfo && tenantInfo);
  const datasetsQuery = useFetchKnowledgeList(canFetchDatasets);
  const createMutation = useCreateKnowledge();
  const deleteMutation = useDeleteKnowledge();
  const [searchString, setSearchString] = React.useState('');

  const error = [
    userQuery.error,
    tenantQuery.error,
    datasetsQuery.error,
    createMutation.error,
    deleteMutation.error,
  ].find(Boolean);

  const datasets = datasetsQuery.data ?? [];
  const filteredDatasets = React.useMemo(() => {
    const normalized = searchString.trim().toLowerCase();
    if (!normalized) {
      return datasets;
    }
    return datasets.filter((dataset) =>
      [dataset.name, dataset.description, dataset.nickname, dataset.created_by]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [datasets, searchString]);

  React.useEffect(() => {
    if (searchParams.get('isCreate') === 'true') {
      setCreateVisible(true);
      searchParams.delete('isCreate');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function refresh() {
    const refetches: Promise<unknown>[] = [userQuery.refetch(), tenantQuery.refetch()];
    if (canFetchDatasets) {
      refetches.push(datasetsQuery.refetch());
    }
    await Promise.all(refetches);
  }

  return (
    <main className="flex size-full min-h-screen flex-col">
      {datasets.length || searchString ? (
        <header className="mb-4 px-5 pt-8">
          <ListFilterBar
            leftPanel={
              <>
                <Database className="size-6" />
                Datasets
              </>
            }
            preChildren={
              <Input
                className="h-9 w-64"
                placeholder="Search"
                value={searchString}
                onChange={(event) => setSearchString(event.currentTarget.value)}
              />
            }
          >
            <Button
              type="button"
              onClick={() => setCreateVisible(true)}
              disabled={!tenantInfo}
            >
              <Plus className="size-[1em]" />
              Create dataset
            </Button>
          </ListFilterBar>
        </header>
      ) : null}
      {error instanceof Error ? (
        <Card className="mx-5 mb-4 border-destructive bg-state-error-5 text-destructive">
          <CardContent className="p-4 text-sm font-medium">{error.message}</CardContent>
        </Card>
      ) : null}
      <DatasetList
        datasets={filteredDatasets}
        isLoading={userQuery.isLoading || tenantQuery.isLoading || datasetsQuery.isLoading}
        isSearching={Boolean(searchString.trim())}
        onCreate={() => setCreateVisible(true)}
        onSelect={(dataset) => navigate(`${Routes.Dataset}/${dataset.id}`)}
        onDelete={(dataset) =>
          deleteMutation.mutateAsync(dataset.id).then(() => {
            void refresh();
          })
        }
      />
      {createVisible && tenantInfo ? (
        <DatasetCreatingDialog
          tenantInfo={tenantInfo}
          hideModal={() => setCreateVisible(false)}
          onOk={(input) => createMutation.mutateAsync(input).then(() => undefined)}
          loading={createMutation.isPending}
        />
      ) : null}
    </main>
  );
}

export default DatasetPage;
