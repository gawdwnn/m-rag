import { Search } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { Input } from '@/components/ui/input';
import { RAGLogo } from './rag-logo';

type SearchHomeProps = {
  canSearch: boolean;
  isSearching: boolean;
  onOpenSetting: () => void;
  searchText: string;
  setIsSearching: Dispatch<SetStateAction<boolean>>;
  setSearchText: Dispatch<SetStateAction<string>>;
};

export function SearchHome({
  canSearch,
  isSearching,
  onOpenSetting,
  searchText,
  setIsSearching,
  setSearchText,
}: SearchHomeProps) {
  function submitSearch() {
    if (!canSearch) {
      onOpenSetting();
      return;
    }
    if (!searchText.trim()) {
      return;
    }
    setIsSearching(!isSearching);
  }

  return (
    <section className="relative flex w-full items-center justify-center pt-[15vh]">
      <div className="relative z-10 flex w-[780px] flex-col items-center justify-center px-8 pt-8">
        <RAGLogo />
        <div className="mt-8 flex h-[240px] w-full justify-center rounded-lg border border-border-button p-6">
          <div className="flex w-2/3 flex-col items-center justify-center">
            <p className="mb-4 text-xl text-text-primary">Hi there</p>
            <p className="mb-10 text-xl text-text-primary">What would you like to search?</p>

            <div className="relative w-full">
              <Input
                className="h-14 w-full rounded-full bg-bg-base px-4 pr-16 text-lg text-text-primary"
                onChange={(event) => setSearchText(event.currentTarget.value)}
                onKeyUp={(event) => {
                  if (event.key === 'Enter') {
                    submitSearch();
                  }
                }}
                placeholder="Input your question here!"
                value={searchText}
              />
              <button
                className="absolute right-2 top-1/2 h-10 w-12 -translate-y-1/2 rounded-full bg-text-primary p-2 text-bg-base shadow disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!searchText.trim()}
                onClick={submitSearch}
                type="button"
              >
                <Search className="m-auto" size={22} />
                <span className="sr-only">Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
