const restAPIv1 = '/api/v1';

export { restAPIv1 };

export default {
  login: `${restAPIv1}/auth/login`,
  logout: `${restAPIv1}/auth/logout`,
  register: `${restAPIv1}/users`,
  setting: `${restAPIv1}/users/me`,
  userInfo: `${restAPIv1}/users/me`,
  tenantInfo: `${restAPIv1}/users/me/models`,
};
