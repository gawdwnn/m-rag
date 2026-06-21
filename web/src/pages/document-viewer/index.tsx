import { useParams, useSearchParams } from 'react-router';

import DocumentPreview from '@/components/document-preview';
import api from '@/utils/api';

export default function DocumentViewer() {
  const { id: documentId } = useParams();
  const [searchParams] = useSearchParams();
  const ext = (searchParams.get('ext') || '').toLowerCase();

  if (!documentId) {
    return (
      <section className="grid h-dvh w-full place-items-center bg-bg-base p-5 text-sm text-state-error">
        Document id is required.
      </section>
    );
  }

  const previewUrl = api.documentPreview(documentId);

  return (
    <section className="h-dvh w-full bg-bg-base">
      <DocumentPreview fileType={ext} url={previewUrl} className="!h-dvh p-5" />
    </section>
  );
}
