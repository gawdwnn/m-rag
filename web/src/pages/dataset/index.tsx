import { FolderOpen } from 'lucide-react';
import { Link, Outlet, useParams } from 'react-router';

import { RAGFlowAvatar } from '@/components/ragflow-avatar';
import { Button } from '@/components/ui/button';
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request';
import { Routes } from '@/routes';

export default function DatasetWrapper() {
  const { id: datasetId = null } = useParams();
  const datasetQuery = useFetchKnowledgeDetail(datasetId);
  const knowledgeBase = datasetQuery.data ?? null;

  return (
    <article className="grid size-full grid-cols-[16rem_minmax(0,1fr)] grid-rows-1 pt-3">
      <aside className="relative flex min-h-0 w-64 flex-col">
        <header
          className="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3 px-5 pb-4"
          style={{ gridTemplateAreas: '"avatar title" "avatar stats"' }}
        >
          <RAGFlowAvatar
            avatar={knowledgeBase?.avatar}
            name={knowledgeBase?.name}
            className="size-16"
            style={{ gridArea: 'avatar' }}
          />

          <h1
            className="truncate text-lg font-semibold text-text-primary"
            style={{ gridArea: 'title' }}
          >
            {datasetQuery.isLoading ? 'Loading...' : knowledgeBase?.name ?? 'Dataset'}
          </h1>

          <div
            className="self-end overflow-hidden text-xs text-text-secondary"
            style={{ gridArea: 'stats' }}
          >
            <div className="flex justify-between gap-3">
              <span>{knowledgeBase ? `${knowledgeBase.document_count} files` : ''}</span>
            </div>
            <div className="mt-0.5">
              {knowledgeBase ? `Created ${formatDate(knowledgeBase.created_at)}` : ''}
            </div>
          </div>
        </header>

        <nav className="overflow-y-auto px-5 pb-5 pt-1">
          <Button
            type="button"
            className="h-10 w-full justify-start gap-2.5 px-3 text-base"
            variant="secondary"
          >
            <FolderOpen className="size-[1em]" />
            <span>Files</span>
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

function formatDate(value?: string) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}
