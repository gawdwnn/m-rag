import { ArrowLeft, Settings } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Routes } from '@/routes';
import { useFetchSearchDetail, useUpdateSearchSetting } from './hooks';
import { SearchHome } from './search-home';
import { SearchSetting } from './search-setting';
import SearchingPage from './searching';

export default function NextSearch() {
  const { id } = useParams();
  const searchQuery = useFetchSearchDetail(id);
  const updateSearch = useUpdateSearchSetting(id);
  const [isSearching, setIsSearching] = useState(false);
  const [openSetting, setOpenSetting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const canSearch = Boolean(searchQuery.data?.search_config.kb_ids?.length);

  useEffect(() => {
    if (searchQuery.data) {
      setOpenSetting(!canSearch);
    }
  }, [canSearch, searchQuery.data]);

  useEffect(() => {
    if (isSearching) {
      setOpenSetting(false);
    }
  }, [isSearching]);

  if (!id) {
    return <Navigate to={Routes.Searches} replace />;
  }

  if (searchQuery.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-text-secondary">
        Loading...
      </main>
    );
  }

  if (searchQuery.error || !searchQuery.data) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-state-error">
        Failed to load Search App.
      </main>
    );
  }

  const search = searchQuery.data;

  return (
    <main
      className="relative flex h-dvh min-h-0 flex-1 overflow-hidden bg-bg-card px-5 pb-5 pt-4 text-text-primary"
      data-testid="search-detail"
    >
      <section className="flex min-h-0 flex-1 gap-3 border border-border-button bg-bg-base">
        <div className="min-w-0 flex-1">
          {!isSearching ? (
            <SearchHome
              canSearch={canSearch}
              isSearching={isSearching}
              onOpenSetting={() => setOpenSetting(true)}
              searchText={searchText}
              setIsSearching={setIsSearching}
              setSearchText={setSearchText}
            />
          ) : (
            <SearchingPage
              search={search}
              searchText={searchText}
              setIsSearching={setIsSearching}
              setSearchText={setSearchText}
            />
          )}
        </div>

        {openSetting ? (
          <SearchSetting
            loading={updateSearch.isPending}
            onClose={() => setOpenSetting(false)}
            onSave={(input) =>
              updateSearch.mutateAsync({
                name: input.name,
                description: input.description,
                search_config: input.search_config,
              })
            }
            search={search}
          />
        ) : null}
      </section>

      <div className="ml-5 flex flex-col gap-2">
        <Button asChild className="bg-bg-base" size="icon" variant="outline">
          <Link to={Routes.Searches}>
            <ArrowLeft className="text-text-secondary" />
            <span className="sr-only">Back to Search Apps</span>
          </Link>
        </Button>
        <Button
          className="bg-bg-base"
          onClick={() => setOpenSetting((current) => !current)}
          size="icon"
          type="button"
          variant="outline"
        >
          <Settings className="text-text-secondary" />
          <span className="sr-only">Search settings</span>
        </Button>
      </div>
    </main>
  );
}
