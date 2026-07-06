import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { FileText, Search, X } from 'lucide-react';

import Empty from '@/components/empty/empty';
import { EmptyType } from '@/components/empty/constant';
import { Input } from '@/components/ui/input';
import { RAGPagination } from '@/components/ui/rag-pagination';
import type { RetrievalChunk } from '@/pages/datasets/types';
import type { SearchApp } from '@/pages/searches/types';
import { Routes } from '@/routes';
import { getExtension } from '@/utils/file-util';
import type { useSearching } from './hooks';
import { RAGLogo } from './rag-logo';
import RetrievalDocuments from './retrieval-documents';

type SearchViewProps = {
  retrieval: ReturnType<typeof useSearching>;
  search: SearchApp;
  searchText: string;
  setIsSearching: Dispatch<SetStateAction<boolean>>;
  setSearchText: Dispatch<SetStateAction<string>>;
};

export function SearchView({
  retrieval,
  search,
  searchText,
  setIsSearching,
  setSearchText,
}: SearchViewProps) {
  const canRun = searchText.trim().length > 0 && Boolean(search.search_config.kb_ids?.length);
  const hasRunInitialSearch = useRef(false);
  const [retrievalLoading, setRetrievalLoading] = useState(false);
  const chunks = retrieval.data.chunks;
  const hasChunks = chunks.length > 0;
  const isSearchTextEmpty = searchText.trim().length === 0;
  const showEmptyResult =
    !isSearchTextEmpty &&
    retrieval.data.isRuned &&
    !retrievalLoading &&
    !retrieval.error &&
    retrieval.data.total <= 0 &&
    !hasChunks;

  function runSearch() {
    if (canRun) {
      retrieval.testChunk({ page: 1, resetFilter: true });
    }
  }

  useEffect(() => {
    if (!hasRunInitialSearch.current && canRun) {
      hasRunInitialSearch.current = true;
      retrieval.testChunk({ page: 1, resetFilter: true });
    }
  }, [canRun, retrieval.testChunk]);

  return (
    <section className="relative flex size-full items-center justify-start">
      <header className="relative z-10 flex size-full items-start px-8 pt-8">
        <RAGLogo onClick={() => setIsSearching(false)} />
        <div className="ml-16 flex h-full flex-1 flex-col justify-center text-primary">
          <div className="flex w-full flex-col items-start justify-start">
            <div className="relative w-full text-primary">
              <Input
                className="h-14 w-full rounded-full bg-bg-base py-6 pl-4 pr-32 text-lg text-text-primary"
                onChange={(event) => setSearchText(event.currentTarget.value)}
                onKeyUp={(event) => {
                  if (event.key === 'Enter') {
                    runSearch();
                  }
                }}
                placeholder="Input your question here!"
                value={searchText}
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button
                  className="grid size-7 place-items-center rounded-full text-text-secondary hover:bg-bg-card"
                  onClick={() => setSearchText('')}
                  type="button"
                >
                  <X size={14} />
                  <span className="sr-only">Clear search</span>
                </button>
                <span className="ml-3 text-text-secondary opacity-20">|</span>
                <button
                  className="ml-3 h-8 w-12 rounded-full bg-text-primary p-1 text-bg-base shadow disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canRun}
                  onClick={runSearch}
                  type="button"
                >
                  <Search className="m-auto" size={22} />
                  <span className="sr-only">Search</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 w-full overflow-auto scrollbar-thin" style={{ height: 'calc(100vh - 250px)' }}>
            {retrieval.error ? (
              <div className="flex h-2/5 items-center justify-center">
                <div className="max-w-md rounded-md border border-state-error/30 bg-state-error/5 p-4 text-sm text-state-error">
                  {retrieval.error.message}
                </div>
              </div>
            ) : null}

            {!isSearchTextEmpty && !retrieval.error ? (
              <div className="mt-3 w-44">
                <RetrievalDocuments
                  onTesting={retrieval.handleFilterSubmit}
                  selectedDocumentIds={retrieval.filterValue.doc_ids}
                  setSelectedDocumentIds={retrieval.setSelectedDocumentIds}
                  setLoading={setRetrievalLoading}
                />
              </div>
            ) : null}

            <div className="mt-3">
              {hasChunks
                ? chunks.map((chunk, index) => (
                    <SearchChunk
                      chunk={chunk}
                      isLast={index === chunks.length - 1}
                      key={chunk.chunk_id}
                    />
                  ))
                : null}
            </div>

            {showEmptyResult ? (
              <div className="flex h-2/5 items-center justify-center">
                <Empty type={EmptyType.SearchData} />
              </div>
            ) : null}

            {retrieval.data.total > retrieval.pageSize ? (
              <div className="mt-8 px-8 pb-8 text-base">
                <RAGPagination
                  current={retrieval.page}
                  onChange={retrieval.onPaginationChange}
                  pageSize={retrieval.pageSize}
                  total={retrieval.data.total}
                />
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </section>
  );
}

function SearchChunk({ chunk, isLast }: { chunk: RetrievalChunk; isLast: boolean }) {
  return (
    <article>
      <div className="flex w-full flex-col">
        <div className="w-full whitespace-pre-wrap text-sm leading-6 text-text-primary">
          {chunk.content_with_weight}
        </div>
        <button
          className="mt-3 flex w-fit items-center gap-2 rounded-lg border border-border-button p-1 text-xs text-text-secondary hover:bg-bg-card"
          onClick={() => {
            window.open(
              `${Routes.Document}/${chunk.doc_id}?ext=${getExtension(chunk.docnm_kwd)}`,
              '_blank',
              'noopener,noreferrer',
            );
          }}
          type="button"
        >
          <FileText className="size-4" />
          <span>{chunk.docnm_kwd}</span>
        </button>
      </div>
      {!isLast ? <div className="mb-2 mt-6 w-full border-b border-border-button" /> : null}
    </article>
  );
}
