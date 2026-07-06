import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { CardContainer } from '@/components/card-container';
import { EmptyAppCard } from '@/components/empty/empty';
import { EmptyCardType } from '@/components/empty/constant';
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
    <>
      {searchApps.length || isSearching ? (
        <article className="flex size-full flex-col" data-testid="search-list">
          <header className="mb-4 px-5 pt-8">
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
                <Plus className="size-[1em]" />
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
              <CardContainer className="flex-1 overflow-auto px-5">
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
              </CardContainer>
              <footer className="mt-4 px-5 pb-5">
                <RAGPagination
                  current={listQuery.pagination.page}
                  pageSize={listQuery.pagination.pageSize}
                  total={listQuery.data.total}
                  onChange={(page) =>
                    listQuery.setPagination((current) => ({ ...current, page }))
                  }
                />
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyAppCard
                showIcon
                size="large"
                className="w-[480px] p-14"
                isSearch
                type={EmptyCardType.Search}
                testId="search-empty-create"
              />
            </div>
          )}
        </article>
      ) : (
        <article
          className="flex size-full items-center justify-center"
          data-testid="search-list"
        >
          <EmptyAppCard
            showIcon
            size="large"
            className="w-[480px] p-14"
            type={EmptyCardType.Search}
            onClick={() => {
              setEditingSearch(null);
              setDialogOpen(true);
            }}
            testId="search-empty-create"
          >
          </EmptyAppCard>
        </article>
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
    </>
  );
}
