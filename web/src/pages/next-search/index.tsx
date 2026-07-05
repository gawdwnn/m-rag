import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Routes } from '@/routes';
import { useFetchSearchDetail, useUpdateSearchSetting } from './hooks';
import { SearchSetting } from './search-setting';
import { SearchView } from './search-view';

export default function NextSearch() {
  const { id } = useParams();
  const searchQuery = useFetchSearchDetail(id);
  const updateSearch = useUpdateSearchSetting(id);

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
    <main className="flex h-dvh bg-bg-base text-text-primary">
      <SearchSetting
        search={search}
        loading={updateSearch.isPending}
        onSave={(input) =>
          updateSearch.mutateAsync({
            name: input.name,
            description: input.description,
            search_config: input.search_config,
          })
        }
      />
      <section className="flex h-full min-w-0 flex-1 flex-col">
        <nav className="flex h-14 items-center border-b border-border-button px-5">
          <Button asChild variant="ghost" size="sm">
            <Link to={Routes.Searches}>
              <ArrowLeft />
              Search Apps
            </Link>
          </Button>
        </nav>
        <SearchView search={search} />
      </section>
    </main>
  );
}
