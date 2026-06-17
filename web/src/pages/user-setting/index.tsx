import { Navigate, Outlet, useLocation } from 'react-router';

import { Routes } from '@/routes';
import { SideBar } from './sidebar';

export default function UserSetting() {
  const location = useLocation();

  if (location.pathname === Routes.UserSetting) {
    return <Navigate to={`${Routes.UserSetting}${Routes.Profile}`} replace />;
  }

  return (
    <section className="grid size-full grid-cols-[auto_1fr] pt-8">
      <SideBar />
      <div className="min-w-0 flex-1 overflow-hidden pr-6 pb-6">
        <Outlet />
      </div>
    </section>
  );
}
