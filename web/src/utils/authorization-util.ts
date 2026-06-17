import { Authorization, Token, UserInfo } from '@/constants/authorization';

const KeySet = [Authorization, Token, UserInfo];

const storage = {
  getAuthorization: () => localStorage.getItem(Authorization),
  getToken: () => localStorage.getItem(Token),
  getUserInfo: () => localStorage.getItem(UserInfo),
  getUserInfoObject: () => {
    const userInfoStr = localStorage.getItem(UserInfo);
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  },
  setAuthorization: (value: string) => {
    localStorage.setItem(Authorization, value);
  },
  setToken: (value: string) => {
    localStorage.setItem(Token, value);
  },
  setUserInfo: (value: string | Record<string, unknown>) => {
    const valueStr = typeof value !== 'string' ? JSON.stringify(value) : value;
    localStorage.setItem(UserInfo, valueStr);
  },
  setItems: (pairs: Record<string, string>) => {
    Object.entries(pairs).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  },
  removeAuthorization: () => {
    localStorage.removeItem(Authorization);
  },
  removeAll: () => {
    KeySet.forEach((key) => {
      localStorage.removeItem(key);
    });
  },
  setLanguage: (lng: string) => {
    localStorage.setItem('lng', lng);
  },
  getLanguage: () => localStorage.getItem('lng') || 'English',
};

const getSearchValue = (key: string) => {
  return new URLSearchParams(window.location.search).get(key);
};

export const getAuthorization = () => {
  const auth = getSearchValue('auth');
  return auth ? `Bearer ${auth}` : storage.getAuthorization() || '';
};

export function redirectToLogin() {
  window.location.href = `${window.location.origin}/login`;
}

export default storage;
