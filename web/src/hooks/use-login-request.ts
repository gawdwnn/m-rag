import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Authorization, Token, UserInfo } from '@/constants/authorization';
import type { UserInfo as UserInfoType } from '@/pages/datasets/types';
import userService from '@/services/user-service';
import authorizationUtil, { redirectToLogin } from '@/utils/authorization-util';
import type { RequestResult } from '@/utils/request';
import { UserSettingApiAction, datasetQueryKey } from './use-user-setting-request';

export interface ILoginRequestBody {
  email: string;
  password: string;
}

export interface IRegisterRequestBody extends ILoginRequestBody {
  nickname: string;
}

function syncAuthQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  user: UserInfoType,
  authorization: string | null,
) {
  authorizationUtil.setItems({
    [Authorization]: authorization ?? '',
    [Token]: user.access_token ?? '',
    [UserInfo]: JSON.stringify({
      avatar: '',
      name: user.nickname,
      email: user.email,
    }),
  });
  queryClient.setQueryData([UserSettingApiAction.UserInfo], user);
  queryClient.invalidateQueries({ queryKey: [UserSettingApiAction.TenantInfo] });
  queryClient.invalidateQueries({ queryKey: datasetQueryKey });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: ILoginRequestBody) => {
      const { data: res, response } = (await userService.login(params)) as RequestResult<UserInfoType>;
      if (res.code === 0) {
        syncAuthQueries(queryClient, res.data, response.headers.get(Authorization));
      }
      return res.code;
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: IRegisterRequestBody) => {
      const { data: res, response } = (await userService.register(params)) as RequestResult<UserInfoType>;
      if (res.code === 0) {
        syncAuthQueries(queryClient, res.data, response.headers.get(Authorization));
      }
      return res.code;
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: res } = (await userService.logout()) as RequestResult<boolean>;
      if (res.code === 0) {
        authorizationUtil.removeAll();
        queryClient.setQueryData([UserSettingApiAction.UserInfo], null);
        queryClient.setQueryData([UserSettingApiAction.TenantInfo], null);
        queryClient.setQueryData(datasetQueryKey, []);
        redirectToLogin();
      }
      return res.code;
    },
  });
}
