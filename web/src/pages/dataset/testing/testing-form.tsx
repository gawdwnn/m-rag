import { Send } from 'lucide-react';
import { FormEvent, useState } from 'react';

import { ButtonLoading } from '@/components/button-loading';
import { FormContainer } from '@/components/form-container';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RetrievalTestInput } from '@/pages/datasets/types';

type TestingFormProps = {
  loading: boolean;
  values: RetrievalTestInput;
  setValues: (values: RetrievalTestInput) => void;
  refetch: (values?: Partial<RetrievalTestInput>) => Promise<unknown>;
};

export default function TestingForm({
  loading,
  values,
  setValues,
  refetch,
}: TestingFormProps) {
  const [question, setQuestion] = useState(values.question || '');
  const [similarityThreshold, setSimilarityThreshold] = useState(
    values.similarity_threshold ?? 0.2,
  );
  const [vectorSimilarityWeight, setVectorSimilarityWeight] = useState(
    values.vector_similarity_weight ?? 0.3,
  );
  const [topK, setTopK] = useState(values.top_k ?? 1024);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextValues = {
      ...values,
      question,
      similarity_threshold: similarityThreshold,
      vector_similarity_weight: vectorSimilarityWeight,
      top_k: topK,
      page: 1,
    };
    setValues(nextValues);
    void refetch(nextValues);
  }

  return (
    <form className="flex size-full flex-col" onSubmit={onSubmit}>
      <div className="h-0 flex-1 px-5">
        <FormContainer className="h-full overflow-auto p-5">
          <div className="grid gap-5">
            <TestingNumberField
              id="similarity-threshold"
              label="Similarity threshold"
              max={1}
              min={0}
              onChange={setSimilarityThreshold}
              step={0.01}
              value={similarityThreshold}
            />

            <TestingNumberField
              id="vector-weight"
              label="Vector similarity weight"
              max={1}
              min={0}
              onChange={setVectorSimilarityWeight}
              step={0.01}
              value={vectorSimilarityWeight}
            />

            <TestingNumberField
              id="top-k"
              label="Top K"
              max={2048}
              min={1}
              onChange={setTopK}
              step={1}
              value={topK}
            />
          </div>
        </FormContainer>
      </div>

      <footer className="flex-0 p-5">
        <label className="grid gap-2">
          <span className="sr-only">Question</span>
          <Textarea
            id="retrieval-question"
            placeholder="Enter a retrieval test question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </label>

        <div className="mt-2.5 text-end">
          <ButtonLoading type="submit" disabled={!question.trim()} loading={loading}>
            Test
            <Send />
          </ButtonLoading>
        </div>
      </footer>
    </form>
  );
}

function TestingNumberField({
  id,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  id: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        max={max}
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (Number.isFinite(nextValue)) {
            onChange(nextValue);
          }
        }}
      />
    </label>
  );
}
