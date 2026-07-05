import { useNavigate } from 'react-router';

import { HomeCard } from '@/components/home-card';
import { SharedBadge } from '@/components/shared-badge';
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
  const datasetCount = data.search_config?.kb_ids?.length ?? 0;

  return (
    <HomeCard
      data={{
        name: data.name,
        avatar: data.avatar,
        description: `${datasetCount} dataset${datasetCount === 1 ? '' : 's'}`,
        update_time: data.update_time ?? data.updated_at,
      }}
      moreDropdown={
        <SearchDropdown search={data} onDelete={onDelete} onRename={onRename} />
      }
      sharedBadge={<SharedBadge>{data.nickname || data.created_by}</SharedBadge>}
      onClick={() => navigate(`${Routes.Search}/${data.id}`)}
    />
  );
}
