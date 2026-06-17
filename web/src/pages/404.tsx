import { Button } from '@/components/ui/button';
import { Routes } from '@/routes';
import { useLocation, useNavigate } from 'react-router';

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-6xl font-semibold text-text-secondary">404</div>
      <p className="mb-8 text-lg text-text-secondary">
        Page not found, please enter a correct address.
      </p>
      <Button
        type="button"
        onClick={() => {
          navigate(location.pathname.startsWith(Routes.DatasetBase) ? Routes.Datasets : Routes.Root);
        }}
      >
        Business
      </Button>
    </main>
  );
}
