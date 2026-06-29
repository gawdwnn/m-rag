import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function UseKnowledgeGraphFormField() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="grid gap-1">
        <Label>Use knowledge graph</Label>
        <span className="text-xs text-text-secondary">Deferred in this retrieval block</span>
      </div>
      <Switch checked={false} disabled />
    </div>
  );
}
