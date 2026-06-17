import { useCallback, useEffect, useState } from 'react';

import { useFetchUserInfo, useSaveSetting } from '@/hooks/use-user-setting-request';
import { rsaPsw } from '@/utils';

interface ProfileData {
  userName: string;
  timeZone: string;
  currPasswd?: string;
  newPasswd?: string;
  avatar: string;
  email: string;
}

export const EditType = {
  editName: 'editName',
  editAvatar: 'editAvatar',
  editTimeZone: 'editTimeZone',
  editPassword: 'editPassword',
} as const;

export type IEditType = keyof typeof EditType;

export const modalTitle = {
  [EditType.editName]: 'Edit Name',
  [EditType.editAvatar]: 'Edit Avatar',
  [EditType.editTimeZone]: 'Edit Time Zone',
  [EditType.editPassword]: 'Edit Password',
} as const;

export const useProfile = () => {
  const { data: userInfo } = useFetchUserInfo();
  const [profile, setProfile] = useState<ProfileData>({
    userName: '',
    avatar: '',
    timeZone: '',
    email: '',
    currPasswd: '',
  });
  const [editType, setEditType] = useState<IEditType>(EditType.editName);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});
  const { saveSetting, loading: submitLoading, data: saveSettingData } = useSaveSetting();

  useEffect(() => {
    setProfile({
      userName: userInfo?.nickname || '',
      timeZone: userInfo?.timezone || 'UTC+8\tAsia/Shanghai',
      avatar: userInfo?.avatar || '',
      email: userInfo?.email || '',
      currPasswd: '',
    });
  }, [userInfo]);

  useEffect(() => {
    if (saveSettingData === 0) {
      setIsEditing(false);
      setEditForm({});
    }
  }, [saveSettingData]);

  const handleEditClick = useCallback(
    (type: IEditType) => {
      setEditForm(profile);
      setEditType(type);
      setIsEditing(true);
    },
    [profile],
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditForm({});
  }, []);

  const handleSave = async (newProfile: ProfileData) => {
    const nextProfile = { ...profile, ...newProfile };
    if (editType === EditType.editName) {
      await saveSetting({ nickname: nextProfile.userName });
    }
    if (editType === EditType.editAvatar) {
      await saveSetting({ avatar: nextProfile.avatar });
    }
    if (editType === EditType.editTimeZone) {
      await saveSetting({ timezone: nextProfile.timeZone });
    }
    if (editType === EditType.editPassword && nextProfile.currPasswd && nextProfile.newPasswd) {
      await saveSetting({
        password: rsaPsw(nextProfile.currPasswd) as string,
        new_password: rsaPsw(nextProfile.newPasswd) as string,
      });
    }
    setProfile(nextProfile);
  };

  return {
    profile,
    submitLoading,
    isEditing,
    editType,
    editForm,
    handleEditClick,
    handleCancel,
    handleSave,
  };
};
