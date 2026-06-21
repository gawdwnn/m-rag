import { Eye } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { useFetchDocumentChunks } from '@/hooks/use-chunk-request';
import { Routes } from '@/routes';
import { getExtension } from '@/utils/file-util';

export default function KnowledgeChunk() {
  const [searchParams] = useSearchParams();
  const datasetId = searchParams.get('id');
  const documentId = searchParams.get('doc_id');
  const query = useFetchDocumentChunks(datasetId, documentId);
  const data = query.data;
  const doc = data?.doc;

  return (
    <main className="flex h-full min-h-0 flex-col bg-bg-base p-5">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-medium">Chunk result</h1>
          <p className="text-sm text-text-secondary">
            {doc?.name || 'Document chunks'} {data ? `(${data.total})` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {doc ? (
            <Button asChild variant="outline">
              <Link to={`${Routes.Document}/${doc.id}?ext=${getExtension(doc.name)}`}>
                <Eye />
                Preview
              </Link>
            </Button>
          ) : null}
          {datasetId ? (
            <Button asChild variant="ghost">
              <Link to={`${Routes.Dataset}/${datasetId}`}>Back to files</Link>
            </Button>
          ) : null}
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-auto rounded-2xl bg-bg-card p-4">
        {query.isLoading ? (
          <div className="grid h-full place-items-center text-sm text-text-secondary">
            Loading...
          </div>
        ) : query.error instanceof Error ? (
          <div className="text-sm text-state-error">{query.error.message}</div>
        ) : data?.chunks.length ? (
          <div className="grid gap-3">
            {data.chunks.map((chunk, index) => (
              <article
                key={chunk.id}
                className="rounded-md border border-border-button bg-bg-base p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-text-secondary">
                  <span>Chunk {index + 1}</span>
                  <span>{chunk.available ? 'enabled' : 'disabled'}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-text-primary">
                  {chunk.content}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid h-full place-items-center text-sm text-text-secondary">
            No chunks found. Parse and index this document first.
          </div>
        )}
      </section>
    </main>
  );
}
