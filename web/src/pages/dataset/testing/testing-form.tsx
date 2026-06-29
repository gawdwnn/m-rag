import { Send } from 'lucide-react';
import { FormEvent, useState } from 'react';

import { ButtonLoading } from '@/components/button-loading';
import { CrossLanguageFormField } from '@/components/cross-language-form-field';
import { FormContainer } from '@/components/form-container';
import { MetadataFilter } from '@/components/metadata-filter';
import {
  RerankFormFields,
  initialTopKValue,
} from '@/components/rerank';
import {
  SimilaritySliderFormField,
  initialSimilarityThresholdValue,
  initialVectorSimilarityWeightValue,
} from '@/components/similarity-slider';
import { Textarea } from '@/components/ui/textarea';
import { UseKnowledgeGraphFormField } from '@/components/use-knowledge-graph-item';
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
    values.similarity_threshold ?? initialSimilarityThresholdValue.similarity_threshold,
  );
  const [vectorSimilarityWeight, setVectorSimilarityWeight] = useState(
    values.vector_similarity_weight ??
      initialVectorSimilarityWeightValue.vector_similarity_weight,
  );
  const [topK, setTopK] = useState(values.top_k ?? initialTopKValue.top_k);

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
            <SimilaritySliderFormField
              similarityThreshold={similarityThreshold}
              vectorSimilarityWeight={vectorSimilarityWeight}
              onSimilarityThresholdChange={setSimilarityThreshold}
              onVectorSimilarityWeightChange={setVectorSimilarityWeight}
            />
            <RerankFormFields topK={topK} onTopKChange={setTopK} />
            <UseKnowledgeGraphFormField />
            <CrossLanguageFormField />
            <MetadataFilter />
            <input
              name="dataset_ids"
              type="hidden"
              value={(values.dataset_ids ?? []).join(',')}
            />
          </div>
        </FormContainer>
      </div>

      <footer className="flex-0 p-5">
        <label className="grid gap-2">
          <span className="sr-only">Question</span>
          <Textarea
            id="retrieval-question"
            placeholder="Input your question here!"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </label>

        <div className="mt-2.5 text-end">
          <ButtonLoading type="submit" disabled={!question.trim()} loading={loading}>
            Run
            <Send />
          </ButtonLoading>
        </div>
      </footer>
    </form>
  );
}
