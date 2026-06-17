import React from 'react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/auth-hooks';
import { useLogin, useRegister } from '@/hooks/use-login-request';
import { rsaPsw } from '@/utils';

type AuthMode = 'login' | 'register';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<AuthMode>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [nickname, setNickname] = React.useState('');
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const { isLogin } = useAuth();
  const isRegister = mode === 'register';
  const isSaving = loginMutation.isPending || registerMutation.isPending;
  const error = loginMutation.error ?? registerMutation.error;

  React.useEffect(() => {
    if (isLogin) {
      navigate('/');
    }
  }, [isLogin, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rsaPassword = rsaPsw(password);
    if (!rsaPassword) {
      throw new Error('Failed to encrypt password.');
    }
    if (isRegister) {
      await registerMutation.mutateAsync({ email, password: rsaPassword, nickname });
      switchMode('login');
      return;
    } else {
      await loginMutation.mutateAsync({ email, password: rsaPassword });
    }
    navigate('/');
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    loginMutation.reset();
    registerMutation.reset();
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md content-center px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{isRegister ? 'Create account' : 'Sign in'}</CardTitle>
          <CardDescription>
            {isRegister ? 'Register a user and tenant workspace.' : 'Use your RAGFlow account.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            {isRegister ? (
              <div className="grid gap-2">
                <Label htmlFor="auth-nickname">Nickname</Label>
                <Input
                  id="auth-nickname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </div>
            {error instanceof Error ? (
              <p className="text-sm font-medium text-destructive">{error.message}</p>
            ) : null}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Submitting...' : isRegister ? 'Create account' : 'Sign in'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
            >
              {isRegister ? 'Already have an account? Sign in' : 'Need an account? Create one'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default LoginPage;
