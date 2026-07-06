import { Home } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import { cn } from '@/lib/utils';
import { Routes } from '@/routes';

const pathMap = {
  [Routes.Datasets]: [Routes.Datasets, Routes.DatasetBase],
  [Routes.Chats]: [Routes.Chats],
  [Routes.Searches]: [Routes.Searches, Routes.Search],
  [Routes.Agents]: [Routes.Agents],
  [Routes.Memories]: [Routes.Memories],
  [Routes.Files]: [Routes.Files],
} as const;

const menuItems = [
  { path: Routes.Root, name: 'Home', icon: Home, enabled: true },
  { path: Routes.Datasets, name: 'Datasets', enabled: true },
  { path: Routes.Chats, name: 'Chat', enabled: false },
  { path: Routes.Searches, name: 'Search', enabled: true },
  { path: Routes.Agents, name: 'Agents', enabled: false },
  { path: Routes.Memories, name: 'Memories', enabled: false },
  { path: Routes.Files, name: 'Files', enabled: false },
];

export default function GlobalNavbar() {
  const { pathname } = useLocation();
  const activePath =
    Object.keys(pathMap).find((path) =>
      pathMap[path as keyof typeof pathMap].some((childPath) =>
        pathname.includes(childPath),
      ),
    ) || pathname;

  return (
    <nav>
      <ul className="flex items-center rounded-full border border-border-button bg-bg-card p-1">
        {menuItems.map(({ path, name, icon: Icon, enabled }) => {
          const isActive = path === activePath;
          const className = cn(
            'inline-flex h-10 items-center justify-center gap-2 rounded-full px-6 text-base transition-colors',
            enabled &&
              !isActive &&
              'hover:text-current focus-visible:text-current',
            enabled &&
              isActive &&
              'border-b-2 border-b-accent-primary bg-text-primary text-bg-base hover:bg-text-primary hover:text-bg-base focus-visible:bg-text-primary focus-visible:text-bg-base',
            !enabled && 'cursor-not-allowed text-text-secondary opacity-60',
          );
          return (
            <li key={path}>
              {enabled ? (
                <Link
                  to={path}
                  className={className}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {Icon ? <Icon className="size-5 stroke-[1.5]" /> : null}
                  <span className={cn(Icon && 'sr-only')}>{name}</span>
                </Link>
              ) : (
                <span className={className} aria-disabled="true">
                  <span>{name}</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
