import { useNavigate } from 'react-router';

import { HomeCard } from '@/components/home-card';
import { Routes } from '@/routes';
import type { SearchApp } from '@/pages/searches/types';
import { SearchDropdown } from './search-dropdown';

type SearchCardProps = {
  data: SearchApp;
  onDelete: (search: SearchApp) => Promise<void>;
  onRename: (search: SearchApp) => void;
};

export function SearchCard({ data, onDelete, onRename }: SearchCardProps) {
  const navigate = useNavigate();

  return (
    <HomeCard
      data={{
        name: data.name,
        avatar: data.avatar,
        description: data.description,
        update_time: data.update_time ?? data.updated_at,
      }}
      moreDropdown={
        <SearchDropdown search={data} onDelete={onDelete} onRename={onRename} />
      }
      onClick={() => navigate(`${Routes.Search}/${data.id}`)}
    />
  );
}
