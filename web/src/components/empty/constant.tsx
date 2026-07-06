import { Database, Search } from 'lucide-react';

export enum EmptyType {
  Data = 'data',
  SearchData = 'search-data',
}

export enum EmptyCardType {
  Dataset = 'dataset',
  Search = 'search',
}

export const EmptyCardData = {
  [EmptyCardType.Dataset]: {
    icon: <Database className="size-6" />,
    title: 'No dataset created yet',
    notFound: 'Dataset not found',
  },
  [EmptyCardType.Search]: {
    icon: <Search className="size-6" />,
    title: 'No Search App created yet',
    notFound: 'Search App not found',
  },
};
