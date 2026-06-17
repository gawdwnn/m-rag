import authorizationUtil from '@/utils/authorization-util';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

export const useOAuthCallback = () => {
  const [currentQueryParameters, setSearchParams] = useSearchParams();
  const error = currentQueryParameters.get('error');
  const auth = currentQueryParameters.get('auth');
  const navigate = useNavigate();
  const newQueryParameters = useMemo(
    () => new URLSearchParams(currentQueryParameters.toString()),
    [currentQueryParameters],
  );

  useEffect(() => {
    if (error) {
      newQueryParameters.delete('error');
      setSearchParams(newQueryParameters);
      navigate('/login');
      return;
    }

    if (auth) {
      authorizationUtil.setAuthorization(auth);
      newQueryParameters.delete('auth');
      setSearchParams(newQueryParameters);
      navigate('/');
    }
  }, [auth, error, navigate, newQueryParameters, setSearchParams]);

  return auth;
};

export const useAuth = () => {
  const auth = useOAuthCallback();
  const [isLogin, setIsLogin] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLogin(Boolean(authorizationUtil.getAuthorization()) || Boolean(auth));
  }, [auth]);

  return { isLogin };
};
