import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

const PREDEFINED_COLORS = [
  { from: '#4F6DEE', to: '#67BDF9' },
  { from: '#38A04D', to: '#93DCA2' },
  { from: '#C35F2B', to: '#EDB395' },
  { from: '#633897', to: '#CBA1FF' },
];

function getStringHash(value: string) {
  const normalized = value.trim().toLowerCase();
  let hash = 104729;
  const seed = 0x9747b28c;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= seed ^ normalized.charCodeAt(index);
    hash = (hash << 13) | (hash >>> 19);
    hash = (hash * 5 + 0x52dce72d) | 0;
  }

  return Math.abs(hash);
}

function getInitial(name?: string) {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0].toUpperCase() : '';
}

function getColorForName(name?: string) {
  if (!name) {
    return { from: 'hsl(0, 0%, 30%)', to: 'hsl(0, 0%, 80%)' };
  }
  return PREDEFINED_COLORS[getStringHash(name) % PREDEFINED_COLORS.length];
}

export function RAGAvatar({
  avatar,
  name,
  className,
  ...props
}: {
  avatar?: string;
  name?: string;
  className?: string;
} & HTMLAttributes<HTMLSpanElement>) {
  const { from, to } = getColorForName(name);
  const initial = getInitial(name);

  return (
    <span
      {...props}
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-md text-white',
        className,
      )}
    >
      {avatar ? (
        <img src={avatar} alt="" className="size-full object-cover" />
      ) : (
        <span
          className="flex size-full items-center justify-center text-lg font-semibold leading-none"
          style={{ backgroundImage: `linear-gradient(to bottom, ${from}, ${to})` }}
          aria-hidden="true"
        >
          {initial}
        </span>
      )}
    </span>
  );
}
