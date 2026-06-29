import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        <Label>Rerank model</Label>
        <Input disabled placeholder="Deferred in this retrieval block" />
      </div>
      <div className="grid gap-2">
        <Label>Top-K</Label>
        <Input
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
    </>
  );
}
