import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import Empty from '@/components/empty/empty';
import { EmptyType } from '@/components/empty/constant';
import ListFilterBar from '@/components/list-filter-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RAGPagination } from '@/components/ui/rag-pagination';
import { Routes } from '@/routes';
import type { SearchApp } from '@/pages/searches/types';
import {
  useCreateSearch,
  useDeleteSearch,
  useFetchSearchList,
  useUpdateSearch,
} from './hooks';
import { SearchCard } from './search-card';
import { SearchCreatingDialog } from './search-creating-dialog';

export default function SearchList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const listQuery = useFetchSearchList();
  const createSearch = useCreateSearch();
  const updateSearch = useUpdateSearch();
  const deleteSearch = useDeleteSearch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SearchApp | null>(null);

  useEffect(() => {
    if (searchParams.get('isCreate') === 'true') {
      setDialogOpen(true);
      searchParams.delete('isCreate');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const searchApps = listQuery.data.search_apps;
  const isSearching = Boolean(listQuery.searchString.trim());

  async function onCreateOrRename(name: string) {
    if (editingSearch) {
      await updateSearch.mutateAsync({ search: editingSearch, name });
      setEditingSearch(null);
      setDialogOpen(false);
      return;
    }
    const created = await createSearch.mutateAsync({ name });
    setDialogOpen(false);
    navigate(`${Routes.Search}/${created.search_id}`);
  }

  async function onDelete(search: SearchApp) {
    if (!window.confirm(`Delete "${search.name}"?`)) {
      return;
    }
    await deleteSearch.mutateAsync(search.id);
  }

  return (
    <article className="flex size-full flex-col" data-testid="search-list">
      <header className="px-5 pt-8 mb-4">
        <ListFilterBar
          leftPanel={
            <>
              <Search className="size-6" />
              Search Apps
            </>
          }
          preChildren={
            <Input
              className="h-9 w-64"
              placeholder="Search"
              value={listQuery.searchString}
              onChange={(event) => listQuery.handleInputChange(event.currentTarget.value)}
            />
          }
        >
          <Button
            data-testid="create-search"
            onClick={() => {
              setEditingSearch(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            Create Search
          </Button>
        </ListFilterBar>
      </header>

      {listQuery.isLoading ? (
        <p className="px-5 text-sm text-text-secondary">Loading...</p>
      ) : listQuery.error ? (
        <p className="px-5 text-sm text-state-error">{listQuery.error.message}</p>
      ) : searchApps.length > 0 ? (
        <>
          <section className="grid flex-1 grid-cols-1 gap-4 overflow-auto px-5 pb-5 sm:grid-cols-2 xl:grid-cols-3">
            {searchApps.map((search) => (
              <SearchCard
                key={search.id}
                data={search}
                onDelete={onDelete}
                onRename={(nextSearch) => {
                  setEditingSearch(nextSearch);
                  setDialogOpen(true);
                }}
              />
            ))}
          </section>
          <RAGPagination
            current={listQuery.pagination.page}
            pageSize={listQuery.pagination.pageSize}
            total={listQuery.data.total}
            onChange={(page) =>
              listQuery.setPagination((current) => ({ ...current, page }))
            }
          />
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center p-5">
          <Empty type={EmptyType.SearchData}>
            <div className="text-sm text-text-secondary">
              {isSearching
                ? 'No matching Search Apps.'
                : 'Create a Search App to save retrieval settings.'}
            </div>
          </Empty>
        </div>
      )}

      <SearchCreatingDialog
        open={dialogOpen}
        initialName={editingSearch?.name}
        loading={createSearch.isPending || updateSearch.isPending}
        onCancel={() => {
          setDialogOpen(false);
          setEditingSearch(null);
        }}
        onOk={onCreateOrRename}
      />
    </article>
  );
}
