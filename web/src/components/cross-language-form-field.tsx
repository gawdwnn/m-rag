import {
  Select,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function CrossLanguageFormField() {
  return (
    <div className="grid gap-2">
      <Label>Cross-language search</Label>
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Deferred in this retrieval block" />
        </SelectTrigger>
      </Select>
    </div>
  );
}
