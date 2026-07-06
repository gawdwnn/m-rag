import { Search } from 'lucide-react';

export function RAGLogo({ onClick }: { onClick?: () => void }) {
  return (
    <button
      className="group flex items-center gap-3 rounded-full px-2 py-1"
      onClick={onClick}
      type="button"
    >
      <span className="grid size-11 place-items-center rounded-xl border border-border-button bg-gradient-to-br from-zinc-950 via-zinc-700 to-zinc-400 text-bg-base shadow-sm">
        <Search className="size-5" />
      </span>
      <span className="text-2xl font-semibold tracking-normal text-text-primary group-hover:text-text-secondary">
        RAG
      </span>
    </button>
  );
}
