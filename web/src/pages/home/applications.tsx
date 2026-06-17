import React from 'react';
import { Bot, MessageSquareText, Search } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';

const options = [
  { value: Routes.Chats, label: 'Chat', icon: MessageSquareText },
  { value: Routes.Searches, label: 'Search', icon: Search },
  { value: Routes.Agents, label: 'Agents', icon: Bot },
];

export function Applications() {
  const [value, setValue] = React.useState(Routes.Chats);
  const selected = options.find((option) => option.value === value) ?? options[0];
  const Icon = selected.icon;

  return (
    <section className="mt-12">
      <header className="mb-2.5 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2.5 text-2xl font-semibold">
          <Icon className="size-6" />
          {selected.label}
        </h2>

        <div className="inline-flex rounded-md border border-border-button bg-bg-card p-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                'h-8 rounded px-3 text-sm transition-colors',
                option.value === value
                  ? 'bg-text-primary text-bg-base'
                  : 'text-text-secondary hover:text-text-primary',
              )}
              onClick={() => setValue(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <Card className="max-w-md">
        <CardContent className="flex min-h-[96px] items-center gap-3 p-5 text-sm text-text-secondary">
          <Icon className="size-5" />
          <span>No {selected.label.toLowerCase()} yet.</span>
        </CardContent>
      </Card>
    </section>
  );
}
