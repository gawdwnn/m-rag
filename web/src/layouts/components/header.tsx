import { Link, useLocation } from 'react-router';

import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import GlobalNavbar from './global-navbar';
import ThemeButton from './theme-button';

export function Header({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { pathname } = useLocation();
  const userQuery = useFetchUserInfo();
  const userInfo = userQuery.data;
  const avatarLabel = userInfo?.nickname || userInfo?.email || 'U';

  return (
    <header
      className={cn(
        'grid w-full grid-cols-[1fr_auto_1fr] items-center gap-8',
        className,
      )}
      {...props}
    >
      <div className="inline-flex items-center">
        <Link
          to={Routes.Root}
          aria-current={pathname === Routes.Root ? 'page' : undefined}
        >
          <img src="/logo.svg" alt="RAG logo" className="size-10" />
        </Link>
      </div>

      <GlobalNavbar />

      <div className="flex items-center justify-end gap-3">
        <ThemeButton />
        <Link
          to={`${Routes.UserSetting}${Routes.Profile}`}
          className="grid size-8 place-items-center rounded-full bg-bg-card text-sm font-medium text-text-primary"
          data-testid="settings-entrypoint"
          aria-label="User settings"
        >
          {avatarLabel.slice(0, 1).toUpperCase()}
        </Link>
      </div>
    </header>
  );
}
