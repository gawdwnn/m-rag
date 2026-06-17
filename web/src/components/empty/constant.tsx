import { Database } from 'lucide-react';

export enum EmptyCardType {
  Dataset = 'dataset',
}

export const EmptyCardData = {
  [EmptyCardType.Dataset]: {
    icon: <Database className="size-6" />,
    title: 'No dataset created yet',
    notFound: 'Dataset not found',
  },
};
