import { lazy, memo, Suspense } from 'react';
import {
  createBrowserRouter,
  redirect,
  type RouteObject,
} from 'react-router';

import FallbackComponent from '@/components/fallback-component';
import authorizationUtil from '@/utils/authorization-util';

export enum Routes {
  Root = '/',
  Login = '/login-next',
  Datasets = '/datasets',
  DatasetBase = '/dataset',
  Files = '/files',
  Dataset = `${Routes.DatasetBase}${Routes.Files}`,
  DatasetTesting = '/retrieval',
  Document = '/document',
  Chunk = '/chunk',
  ParsedResult = `${Routes.Chunk}/parsed-result`,
  Chats = '/chats',
  Search = '/search',
  Searches = '/searches',
  Agents = '/agents',
  Memories = '/memories',
  UserSetting = '/user-setting',
  Profile = '/profile',
}

const defaultRouteFallback = (
  <main className="grid min-h-screen place-items-center text-sm text-text-secondary">
    Loading...
  </main>
);

type LazyRouteConfig = Omit<RouteObject, 'Component' | 'children'> & {
  Component?: () => Promise<{ default: React.ComponentType<any> }>;
  children?: LazyRouteConfig[];
};

const withLazyRoute = (
  importer: () => Promise<{ default: React.ComponentType<any> }>,
  fallback: React.ReactNode = defaultRouteFallback,
) => {
  const LazyComponent = lazy(importer);
  const Wrapped: React.FC<any> = (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
  Wrapped.displayName = `LazyRoute(${
    (LazyComponent as unknown as React.ComponentType<any>).displayName ||
    LazyComponent.name ||
    'Component'
  })`;
  return import.meta.env.DEV ? LazyComponent : memo(Wrapped);
};

const routeConfigOptions: LazyRouteConfig[] = [
  {
    path: '/login',
    Component: () => import('@/pages/login-next'),
  },
  {
    path: Routes.Login,
    Component: () => import('@/pages/login-next'),
  },
  {
    path: `${Routes.Document}/:id`,
    Component: () => import('@/pages/document-viewer'),
  },
  {
    path: `${Routes.Search}/:id`,
    Component: () => import('@/pages/next-search'),
  },
  {
    path: '/*',
    Component: () => import('@/pages/404'),
  },
  {
    path: Routes.Root,
    Component: () => import('@/layouts/root-layout'),
    loader: ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      const auth = url.searchParams.get('auth');
      if (auth) {
        authorizationUtil.setAuthorization(auth);
        url.searchParams.delete('auth');
        return redirect(`${url.pathname}${url.search}`);
      }
      return null;
    },
    children: [
      {
        path: Routes.Root,
        Component: () => import('@/pages/home'),
      },
    ],
  },
  {
    path: Routes.Root,
    Component: () => import('@/layouts/root-layout'),
    children: [
      {
        path: Routes.Datasets,
        Component: () => import('@/pages/datasets'),
      },
      {
        path: Routes.Searches,
        Component: () => import('@/pages/next-searches'),
      },
      {
        path: Routes.DatasetBase,
        Component: () => import('@/pages/dataset'),
        children: [
          {
            path: `${Routes.Dataset}/:id`,
            Component: () => import('@/pages/dataset/dataset'),
          },
          {
            path: `${Routes.DatasetBase}${Routes.DatasetTesting}/:id`,
            Component: () => import('@/pages/dataset/testing'),
          },
        ],
      },
      {
        path: Routes.UserSetting,
        Component: () => import('@/pages/user-setting'),
        children: [
          {
            path: `${Routes.UserSetting}${Routes.Profile}`,
            Component: () => import('@/pages/user-setting/profile'),
          },
        ],
      },
      {
        path: `${Routes.ParsedResult}/chunks`,
        Component: () =>
          import('@/pages/chunk/parsed-result/add-knowledge/components/knowledge-chunk'),
      },
    ],
  },
];

const wrapRoutes = (routes: LazyRouteConfig[]): RouteObject[] =>
  routes.map((item) => {
    const { Component, children, ...rest } = item;
    const next: RouteObject = { ...rest, errorElement: <FallbackComponent /> };
    if (Component) {
      next.Component = withLazyRoute(Component);
    }
    if (children) {
      next.children = wrapRoutes(children);
    }
    return next;
  });

const routeConfig = wrapRoutes(routeConfigOptions);

export const routers = createBrowserRouter(routeConfig);
