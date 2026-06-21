import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';

import { ThemeProvider } from './components/theme-provider';
import { TooltipProvider } from './components/ui/tooltip';
import { routers } from './routes';

const queryClient = new QueryClient();

export default function App() {
  return (
    <TooltipProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={routers} />
        </QueryClientProvider>
      </ThemeProvider>
    </TooltipProvider>
  );
}
