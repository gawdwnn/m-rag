import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type SimilaritySliderFormFieldProps = {
  similarityThreshold: number;
  vectorSimilarityWeight: number;
  onSimilarityThresholdChange: (value: number) => void;
  onVectorSimilarityWeightChange: (value: number) => void;
};

export const initialSimilarityThresholdValue = {
  similarity_threshold: 0.2,
};

export const initialVectorSimilarityWeightValue = {
  vector_similarity_weight: 0.3,
};

export function SimilaritySliderFormField({
  similarityThreshold,
  vectorSimilarityWeight,
  onSimilarityThresholdChange,
  onVectorSimilarityWeightChange,
}: SimilaritySliderFormFieldProps) {
  return (
    <>
      <SliderInputFormField
        label="Similarity threshold"
        max={1}
        min={0}
        onChange={onSimilarityThresholdChange}
        step={0.01}
        value={similarityThreshold}
      />
      <VectorSimilarityWeightField
        onChange={onVectorSimilarityWeightChange}
        value={vectorSimilarityWeight}
      />
    </>
  );
}

function VectorSimilarityWeightField({
  onChange,
  value,
}: {
  onChange: (value: number) => void;
  value: number;
}) {
  const normalized = normalizeWeight(value);
  const fullTextWeight = normalizeWeight(1 - normalized);

  return (
    <div className="grid gap-2">
      <Label>Vector similarity weight</Label>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between">
            <WeightLabel label="vector" value={normalized} />
            <WeightLabel label="full-text" value={fullTextWeight} />
          </div>
          <Input
            className="cursor-pointer p-0 accent-primary"
            max={1}
            min={0}
            onChange={(event) => onChange(readNumber(event.currentTarget.value, normalized))}
            step={0.01}
            type="range"
            value={normalized}
          />
        </div>
        <NumberInput value={normalized} onChange={onChange} />
      </div>
    </div>
  );
}

function SliderInputFormField({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span className="text-xs text-text-secondary">{Math.round(value * 100)}%</span>
      </div>
      <div className="flex items-center gap-4">
        <Input
          className="cursor-pointer p-0 accent-primary"
          max={max}
          min={min}
          onChange={(event) => onChange(readNumber(event.currentTarget.value, value))}
          step={step}
          type="range"
          value={value}
        />
        <NumberInput value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function NumberInput({
  className,
  onChange,
  value,
}: {
  className?: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <Input
      className={cn(
        'h-6 w-12 border-border-button bg-bg-input p-0 text-center text-xs text-text-secondary',
        '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        className,
      )}
      max={1}
      min={0}
      onChange={(event) => onChange(readNumber(event.currentTarget.value, value))}
      step={0.01}
      type="number"
      value={value}
    />
  );
}

function WeightLabel({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs italic text-text-secondary">{label}</span>
      <span className="w-10 rounded-md bg-bg-card p-1 text-center text-xs">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function normalizeWeight(value: number) {
  return Number(Math.max(0, Math.min(value, 1)).toFixed(2));
}

function readNumber(value: string, fallback: number) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}
