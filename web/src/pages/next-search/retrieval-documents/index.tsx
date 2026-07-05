import { ExternalLink } from 'lucide-react';

import Empty from '@/components/empty/empty';
import { EmptyType } from '@/components/empty/constant';
import { FilterButton } from '@/components/list-filter-bar';
import { FilterPopover } from '@/components/list-filter-bar/filter-popover';
import type { FilterCollection } from '@/components/list-filter-bar/interface';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RAGPagination } from '@/components/ui/rag-pagination';
import type { RetrievalChunk, RetrievalTestResponse } from '@/pages/datasets/types';
import { Routes } from '@/routes';
import { getExtension } from '@/utils/file-util';

const similarityList: Array<{ field: keyof RetrievalChunk; label: string }> = [
  { field: 'similarity', label: 'Hybrid similarity' },
  { field: 'term_similarity', label: 'Term similarity' },
  { field: 'vector_similarity', label: 'Vector similarity' },
];

type RetrievalDocumentsProps = {
  data: RetrievalTestResponse & { isRuned: boolean };
  filterValue: { doc_ids: string[] };
  page: number;
  pageSize: number;
  loading: boolean;
  error: Error | null;
  handleFilterSubmit: (docIds: string[]) => void;
  onPaginationChange: (page: number) => void;
};

export function RetrievalDocuments({
  data,
  filterValue,
  page,
  pageSize,
  loading,
  error,
  handleFilterSubmit,
  onPaginationChange,
}: RetrievalDocumentsProps) {
  const filters: FilterCollection[] = [
    {
      field: 'doc_ids',
      label: 'File',
      list: data.doc_aggs.map((doc) => ({
        id: doc.doc_id,
        label: doc.doc_name,
        count: doc.count,
      })),
    },
  ];

  return (
    <article className="flex size-full flex-col">
      <header className="flex flex-0 items-center justify-between px-5 py-3">
        <h2 className="text-base leading-8 font-semibold">Results</h2>
        <FilterPopover
          filters={filters}
          onChange={handleFilterSubmit}
          value={filterValue}
        >
          <FilterButton />
        </FilterPopover>
      </header>

      <div className="h-0 flex-1">
        {error ? (
          <div className="p-5 text-sm text-state-error">{error.message}</div>
        ) : null}

        {loading ? (
          <div className="grid size-full place-items-center text-sm text-text-secondary">
            Loading...
          </div>
        ) : data.chunks.length > 0 ? (
          <>
            <section className="scrollbar-thin flex h-full flex-col gap-5 overflow-auto px-5 pb-5">
              {data.chunks.map((chunk) => (
                <article key={chunk.chunk_id}>
                  <Card className="bg-transparent px-5 py-2.5 shadow-none">
                    <ChunkTitle item={chunk} />
                    <p className="!mt-2.5 whitespace-pre-wrap text-sm leading-6">
                      {chunk.content_with_weight}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-4 text-xs text-text-secondary">
                      <p className="min-w-0 truncate">{chunk.docnm_kwd}</p>
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => {
                          window.open(
                            `${Routes.Document}/${chunk.doc_id}?ext=${getExtension(chunk.docnm_kwd)}`,
                            '_blank',
                            'noopener,noreferrer',
                          );
                        }}
                      >
                        <ExternalLink />
                        Source
                      </Button>
                    </div>
                  </Card>
                </article>
              ))}
            </section>

            <RAGPagination
              current={page}
              onChange={onPaginationChange}
              pageSize={pageSize}
              total={data.total}
            />
          </>
        ) : (
          <div className="flex size-full items-center justify-center p-5">
            <Empty type={EmptyType.SearchData}>
              <div className="text-sm text-text-secondary">
                {data.isRuned
                  ? 'No relevant results found. Try adjusting the query or saved settings.'
                  : 'Run a search to inspect retrieved chunks.'}
              </div>
            </Empty>
          </div>
        )}
      </div>
    </article>
  );
}

function ChunkTitle({ item }: { item: RetrievalChunk }) {
  return (
    <div className="space-x-4 text-xs text-text-secondary italic">
      {similarityList.map((score) => (
        <p key={score.field} className="inline">
          {((Number(item[score.field]) || 0) * 100).toFixed(2)}{' '}
          <dfn>{score.label}</dfn>
        </p>
      ))}
    </div>
  );
}
