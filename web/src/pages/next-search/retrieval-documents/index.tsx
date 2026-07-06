import { ChevronDown, Files, X } from 'lucide-react';
import { useEffect, useState, type MouseEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  useAllTestingResult,
  useChunkIsTesting,
  useSelectTestingResult,
} from '@/hooks/use-knowledge-request';

type RetrievalDocumentsProps = {
  selectedDocumentIds: string[];
  onTesting: (documentIds: string[]) => void;
  setSelectedDocumentIds: (documentIds: string[]) => void;
  setLoading?: (loading: boolean) => void;
};

export default function RetrievalDocuments({
  selectedDocumentIds,
  onTesting,
  setSelectedDocumentIds,
  setLoading,
}: RetrievalDocumentsProps) {
  const { documents: allDocuments } = useAllTestingResult();
  const { documents: currentDocuments } = useSelectTestingResult();
  const isTesting = useChunkIsTesting();
  const documents =
    allDocuments.length > currentDocuments.length ? allDocuments : currentDocuments;
  const [selectedValues, setSelectedValues] = useState<string[]>(selectedDocumentIds);

  useEffect(() => {
    setLoading?.(isTesting);
  }, [isTesting, setLoading]);

  useEffect(() => {
    setSelectedValues(selectedDocumentIds);
  }, [selectedDocumentIds]);

  if (documents.length === 0) {
    return null;
  }

  function updateSelection(nextValues: string[]) {
    setSelectedValues(nextValues);
    setSelectedDocumentIds(nextValues);
    onTesting(nextValues);
  }

  function toggleDocument(documentId: string) {
    const nextValues = selectedValues.includes(documentId)
      ? selectedValues.filter((value) => value !== documentId)
      : [...selectedValues, documentId];
    updateSelection(nextValues);
  }

  function clearSelection(event?: MouseEvent<SVGSVGElement>) {
    event?.stopPropagation();
    updateSelection([]);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="flex min-h-10 w-full items-center justify-between rounded-md border border-border-button bg-inherit p-1 text-base text-text-primary hover:bg-inherit [&_svg]:pointer-events-auto"
          type="button"
          variant="ghost"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Files className="size-4 shrink-0" />
            <span>
              {selectedValues.length}/{documents.length}
            </span>
            <span>Files</span>
          </span>
          <span className="flex items-center">
            <X
              className="mx-2 size-4 cursor-pointer text-muted-foreground"
              onClick={clearSelection}
            />
            <Separator orientation="vertical" className="min-h-6" />
            <ChevronDown className="mx-2 size-4 text-muted-foreground" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuCheckboxItem
          checked={selectedValues.length === 0}
          onCheckedChange={() => updateSelection([])}
        >
          All files
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {documents.map((document) => (
          <DropdownMenuCheckboxItem
            checked={selectedValues.includes(document.doc_id)}
            key={document.doc_id}
            onCheckedChange={() => toggleDocument(document.doc_id)}
          >
            <span className="min-w-0 flex-1 truncate">{document.doc_name}</span>
            <span className="ml-auto text-xs text-text-secondary">{document.count}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
