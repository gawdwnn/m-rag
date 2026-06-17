import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { TenantInfo, UserInfo } from '@/pages/datasets/types';
import userService from '@/services/user-service';
import type { RequestResult } from '@/utils/request';

export const enum UserSettingApiAction {
  UserInfo = 'userInfo',
  TenantInfo = 'tenantInfo',
}

export const datasetQueryKey = ['datasets'] as const;

export function useFetchUserInfo() {
  return useQuery({
    queryKey: [UserSettingApiAction.UserInfo],
    queryFn: async () => {
      const { data: res } = (await userService.userInfo()) as RequestResult<UserInfo>;
      return res.data;
    },
    retry: false,
  });
}

export function useFetchTenantInfo(enabled = true) {
  return useQuery({
    queryKey: [UserSettingApiAction.TenantInfo],
    queryFn: async () => {
      const { data: res } = (await userService.getTenantInfo()) as RequestResult<TenantInfo>;
      return res.data;
    },
    enabled,
    retry: false,
  });
}

export function useSaveSetting() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (userInfo: Partial<UserInfo> & { password?: string; new_password?: string }) => {
      const { data: res } = (await userService.setting(userInfo)) as RequestResult<UserInfo>;
      return res.code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UserSettingApiAction.UserInfo] });
    },
  });

  return {
    data: mutation.data,
    loading: mutation.isPending,
    saveSetting: mutation.mutateAsync,
  };
}
