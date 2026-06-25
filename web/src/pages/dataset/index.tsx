import { FolderOpen, Search } from 'lucide-react';
import { Link, Outlet, useLocation, useParams } from 'react-router';

import { RAGAvatar } from '@/components/rag-avatar';
import { Button } from '@/components/ui/button';
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request';
import { Routes } from '@/routes';

export default function DatasetWrapper() {
  const { id: datasetId = null } = useParams();
  const location = useLocation();
  const datasetQuery = useFetchKnowledgeDetail(datasetId);
  const knowledgeBase = datasetQuery.data ?? null;
  const datasetTestingPath = `${Routes.DatasetBase}${Routes.DatasetTesting}`;
  const navItems = [
    {
      icon: FolderOpen,
      label: 'Files',
      to: datasetId ? `${Routes.Dataset}/${datasetId}` : Routes.Datasets,
      active: location.pathname.startsWith(Routes.Dataset),
    },
    {
      icon: Search,
      label: 'Retrieval',
      to: datasetId ? `${datasetTestingPath}/${datasetId}` : Routes.Datasets,
      active: location.pathname.startsWith(datasetTestingPath),
    },
  ];

  return (
    <article className="grid size-full grid-cols-[16rem_minmax(0,1fr)] grid-rows-1 pt-3">
      <aside className="relative flex min-h-0 w-64 flex-col">
        <header
          className="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3 px-5 pb-4"
          style={{ gridTemplateAreas: '"avatar title" "avatar stats"' }}
        >
          <RAGAvatar
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

        <nav className="grid gap-1 overflow-y-auto px-5 pb-5 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                asChild
                key={item.label}
                className="h-10 w-full justify-start gap-2.5 px-3 text-base"
                variant={item.active ? 'secondary' : 'ghost'}
              >
                <Link to={item.to}>
                  <Icon className="size-[1em]" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
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
