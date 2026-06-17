import { Outlet } from 'react-router';

import { Header } from './components/header';

export function RootLayoutContainer({
  children,
}: React.PropsWithChildren) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr]">
      <Header className="px-5 py-4" />
      <main className="min-h-0 overflow-hidden">{children}</main>
    </div>
  );
}

export default function RootLayout() {
  return (
    <RootLayoutContainer>
      <Outlet />
    </RootLayoutContainer>
  );
}
