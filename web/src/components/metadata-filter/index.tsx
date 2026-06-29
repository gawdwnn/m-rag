import {
  Select,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function MetadataFilter() {
  return (
    <div className="grid gap-2">
      <Label>Meta data</Label>
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Deferred in this retrieval block" />
        </SelectTrigger>
      </Select>
    </div>
  );
}
