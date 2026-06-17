import { Link, Outlet, useParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request';
import { Routes } from '@/routes';

export default function DatasetWrapper() {
  const { id: datasetId = null } = useParams();
  const datasetQuery = useFetchKnowledgeDetail(datasetId);
  const knowledgeBase = datasetQuery.data ?? null;

  return (
    <article className="grid size-full grid-cols-[16rem_minmax(0,1fr)] grid-rows-1 pt-3">
      <aside className="flex min-h-0 flex-col border-r">
        <header className="grid grid-cols-[auto_1fr] gap-x-3 px-5 pb-4">
          <div className="grid size-16 place-items-center rounded-md bg-bg-card text-xl font-semibold">
            {knowledgeBase ? knowledgeBase.name.slice(0, 1).toUpperCase() : '-'}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">
              {datasetQuery.isLoading ? 'Loading...' : knowledgeBase?.name ?? 'Dataset'}
            </h1>
            <p className="mt-1 text-xs text-text-secondary">
              {knowledgeBase ? `${knowledgeBase.document_count} files` : ''}
            </p>
          </div>
        </header>
        <nav className="px-5 pt-1">
          <Button className="w-full justify-start" variant="secondary">
            Files
          </Button>
        </nav>
        <div className="mt-auto px-5 pb-5">
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link to={Routes.Datasets}>Datasets</Link>
          </Button>
        </div>
      </aside>

      <Outlet />
    </article>
  );
}
