import { isRouteErrorResponse, useRouteError } from 'react-router';

export default function FallbackComponent() {
  const routeError = useRouteError();
  const message = isRouteErrorResponse(routeError)
    ? `${routeError.status} ${routeError.statusText}`
    : routeError instanceof Error
      ? routeError.message
      : routeError
        ? String(routeError)
        : 'Unknown route error';

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-lg text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-text-secondary">
          The page failed to load.
        </p>
        <pre className="mt-4 overflow-auto rounded-md border border-border-button bg-bg-card p-3 text-left text-xs text-text-secondary">
          {message}
        </pre>
      </section>
    </main>
  );
}
