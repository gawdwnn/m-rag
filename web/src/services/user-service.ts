import api from '@/utils/api';
import registerServer from '@/utils/register-server';
import request from '@/utils/request';

const { login, logout, register, setting, userInfo, tenantInfo } = api;

const methods = {
  login: {
    url: login,
    method: 'post',
  },
  logout: {
    url: logout,
    method: 'post',
  },
  register: {
    url: register,
    method: 'post',
  },
  setting: {
    url: setting,
    method: 'patch',
  },
  userInfo: {
    url: userInfo,
    method: 'get',
  },
  getTenantInfo: {
    url: tenantInfo,
    method: 'get',
  },
} as const;

const userService = registerServer<keyof typeof methods>(methods, request);

export default userService;
