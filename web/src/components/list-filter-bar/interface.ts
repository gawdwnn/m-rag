export type FilterOption = {
  id: string;
  label: string;
  count?: number;
};

export type FilterCollection = {
  field: 'doc_ids';
  label: string;
  list: FilterOption[];
};
