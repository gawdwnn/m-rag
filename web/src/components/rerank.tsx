import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export const initialTopKValue = {
  top_k: 1024,
};

type RerankFormFieldsProps = {
  topK: number;
  onTopKChange: (value: number) => void;
};

export function RerankFormFields({ onTopKChange, topK }: RerankFormFieldsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label>Top-K</Label>
        <Input
          className="h-7 rounded-sm border-border-button bg-bg-input"
          max={2048}
          min={1}
          onChange={(event) => {
            const nextValue = Number(event.currentTarget.value);
            if (Number.isFinite(nextValue)) {
              onTopKChange(nextValue);
            }
          }}
          step={1}
          type="number"
          value={topK}
        />
      </div>
      <div className="flex flex-row items-start gap-3">
        <Switch checked={false} disabled />
        <div className="grid gap-1">
          <Label>Rerank model</Label>
          <span className="text-xs text-text-secondary">
            Deferred until rerank model wiring is taught.
          </span>
        </div>
      </div>
    </>
  );
}
