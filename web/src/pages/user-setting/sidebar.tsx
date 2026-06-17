import { LogOut, User } from 'lucide-react';
import { NavLink } from 'react-router';

import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/use-login-request';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';

export function SideBar() {
  const userQuery = useFetchUserInfo();
  const userInfo = userQuery.data;
  const logoutMutation = useLogout();

  return (
    <aside className="flex w-[303px] flex-col border-r border-border-button bg-bg-base">
      <header className="px-6">
        <h1 className="flex items-center gap-2.5 font-normal">
          <span className="grid size-10 place-items-center rounded-full bg-bg-card text-sm font-medium">
            {(userInfo?.nickname || userInfo?.email || 'U').slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate text-sm text-text-primary">{userInfo?.email}</span>
        </h1>
      </header>

      <nav className="mt-4 flex-1 overflow-auto py-1">
        <ul className="flex flex-col gap-5 px-6">
          <li>
            <NavLink
              to={`${Routes.UserSetting}${Routes.Profile}`}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-md px-3 text-base',
                  isActive && 'bg-bg-card text-text-primary',
                )
              }
            >
              <User className="size-4" />
              <span>Profile</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <footer className="mt-auto p-6">
        <Button
          type="button"
          className="w-full justify-start gap-2"
          variant="ghost"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
      </footer>
    </aside>
  );
}
