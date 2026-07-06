import type { Dispatch, SetStateAction } from 'react';

import type { SearchApp } from '@/pages/searches/types';
import { useSearching } from './hooks';
import { SearchView } from './search-view';

type SearchingPageProps = {
  search: SearchApp;
  searchText: string;
  setIsSearching: Dispatch<SetStateAction<boolean>>;
  setSearchText: Dispatch<SetStateAction<string>>;
};

export default function SearchingPage({
  search,
  searchText,
  setIsSearching,
  setSearchText,
}: SearchingPageProps) {
  const retrieval = useSearching({
    searchText,
    data: search,
  });

  return (
    <SearchView
      retrieval={retrieval}
      search={search}
      searchText={searchText}
      setIsSearching={setIsSearching}
      setSearchText={setSearchText}
    />
  );
}
