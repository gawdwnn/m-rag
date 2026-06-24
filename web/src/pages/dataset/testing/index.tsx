import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTestRetrieval } from '@/hooks/use-knowledge-request';
import { useParams } from 'react-router';
import TestingForm from './testing-form';
import { TestingResult } from './testing-result';

export default function RetrievalTesting() {
  const { id: datasetId = null } = useParams();
  const retrieval = useTestRetrieval(datasetId);

  return (
    <div className="pr-5 pb-5">
      <Card className="flex size-full flex-col bg-transparent shadow-none">
        <CardHeader className="border-b-0.5 border-border-button p-5">
          <header>
            <CardTitle>Retrieval Testing</CardTitle>
            <CardDescription>
              Test whether indexed chunks can be found before building Search or Chat.
            </CardDescription>
          </header>
        </CardHeader>

        <CardContent className="grid flex-1 grid-cols-2 grid-rows-1 divide-x-0.5 overflow-hidden p-0">
          <article className="flex size-full flex-1 flex-col">
            <header className="px-5 py-3">
              <h2 className="text-base leading-8 font-semibold">Test Settings</h2>
            </header>

            <div className="h-0 flex-1">
              <TestingForm
                loading={retrieval.loading}
                values={retrieval.values}
                setValues={retrieval.setValues}
                refetch={retrieval.refetch}
              />
            </div>
          </article>

          <div className="flex-1">
            <TestingResult
              data={retrieval.data}
              page={retrieval.page}
              loading={retrieval.loading}
              pageSize={retrieval.pageSize}
              filterValue={retrieval.filterValue}
              error={retrieval.error}
              handleFilterSubmit={retrieval.handleFilterSubmit}
              onPaginationChange={retrieval.onPaginationChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
