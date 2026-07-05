import { FormEvent } from 'react';
import { Send } from 'lucide-react';

import { ButtonLoading } from '@/components/button-loading';
import { Textarea } from '@/components/ui/textarea';
import type { SearchApp } from '@/pages/searches/types';
import { useSearchCompletion } from './hooks';
import { RetrievalDocuments } from './retrieval-documents';

type SearchViewProps = {
  search: SearchApp;
};

export function SearchView({ search }: SearchViewProps) {
  const completion = useSearchCompletion(search);
  const canRun = completion.question.trim() && search.search_config.kb_ids.length > 0;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canRun) {
      void completion.refetch({ page: 1 });
    }
  }

  return (
    <section className="flex size-full flex-col">
      <header className="border-b border-border-button px-5 py-4">
        <h1 className="text-lg font-semibold">{search.name}</h1>
        {search.description ? (
          <p className="mt-1 text-sm text-text-secondary">{search.description}</p>
        ) : null}
      </header>

      <div className="grid h-0 flex-1 grid-cols-1 grid-rows-1 overflow-hidden">
        <RetrievalDocuments
          data={completion.data}
          filterValue={completion.filterValue}
          page={completion.page}
          loading={completion.loading}
          pageSize={completion.pageSize}
          error={completion.error}
          handleFilterSubmit={completion.handleFilterSubmit}
          onPaginationChange={completion.onPaginationChange}
        />
      </div>

      <form className="border-t border-border-button p-5" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="sr-only">Question</span>
          <Textarea
            id="search-question"
            placeholder="Input your question here!"
            value={completion.question}
            onChange={(event) => completion.setQuestion(event.currentTarget.value)}
          />
        </label>
        <div className="mt-2.5 text-end">
          <ButtonLoading
            type="submit"
            disabled={!canRun}
            loading={completion.loading}
          >
            Run
            <Send />
          </ButtonLoading>
        </div>
      </form>
    </section>
  );
}
