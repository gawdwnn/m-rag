import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  const error = [
    userQuery.error,
    tenantQuery.error,
    datasetsQuery.error,
    createMutation.error,
    deleteMutation.error,
  ].find(Boolean);

  const datasets = datasetsQuery.data ?? [];

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
      <header className="mb-4 flex items-end justify-between gap-4 px-5 pt-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Datasets</h1>
          <p className="text-sm text-text-secondary">
            Create datasets and add files for parsing.
          </p>
        </div>
      </header>

      <div className="mb-4 flex justify-end px-5">
        <Button
          type="button"
          onClick={() => setCreateVisible(true)}
          disabled={!tenantInfo}
        >
          <Plus />
          Create dataset
        </Button>
      </div>
      <DatasetList
        datasets={datasets}
        isLoading={userQuery.isLoading || tenantQuery.isLoading || datasetsQuery.isLoading}
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

      {error instanceof Error ? (
        <Card className="mx-5 border-destructive bg-state-error-5 text-destructive">
          <CardContent className="p-4 text-sm font-medium">{error.message}</CardContent>
        </Card>
      ) : null}
    </main>
  );
}

export default DatasetPage;
