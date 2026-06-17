import { PenLine } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileSettingWrapperCard } from '../components/user-setting-header';
import { EditType, type IEditType, modalTitle, useProfile } from './hooks/use-profile';

export default function ProfilePage() {
  const {
    profile,
    editType,
    isEditing,
    submitLoading,
    editForm,
    handleEditClick,
    handleCancel,
    handleSave,
  } = useProfile();
  const [form, setForm] = React.useState(editForm);

  React.useEffect(() => {
    setForm(editForm);
  }, [editForm]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSave({
      userName: String(form.userName || ''),
      avatar: String(form.avatar || ''),
      timeZone: String(form.timeZone || ''),
      email: profile.email,
      currPasswd: String(form.currPasswd || ''),
      newPasswd: String(form.newPasswd || ''),
    });
  }

  return (
    <ProfileSettingWrapperCard
      header={
        <header>
          <h2 className="text-2xl font-medium">Profile</h2>
          <p className="mt-1 text-sm text-text-secondary">Manage your account profile.</p>
        </header>
      }
    >
      <div className="w-3/4 max-w-3xl space-y-11 p-7">
        <ProfileRow label="Username" value={profile.userName} onEdit={() => handleEditClick(EditType.editName)} />
        <ProfileRow label="Avatar" value={profile.avatar ? 'Custom avatar set' : ''} onEdit={() => handleEditClick(EditType.editAvatar)} />
        <ProfileRow label="Time Zone" value={profile.timeZone} onEdit={() => handleEditClick(EditType.editTimeZone)} />
        <div className="flex items-start gap-4">
          <label className="w-[190px] text-sm font-medium">Email</label>
          <div className="flex flex-1 flex-col items-start gap-2">
            <div className="flex-1 rounded-md py-1.5 text-sm">{profile.email}</div>
            <span className="text-xs text-text-secondary">Email is used for sign in.</span>
          </div>
        </div>
        <ProfileRow
          label="Password"
          value={profile.currPasswd ? '********' : ''}
          onEdit={() => handleEditClick(EditType.editPassword)}
        />
      </div>

      <Dialog open={isEditing} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalTitle[editType]}</DialogTitle>
          </DialogHeader>
          <form className="grid gap-6" onSubmit={onSubmit}>
            <EditFields editType={editType} form={form} setForm={setForm} />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitLoading}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ProfileSettingWrapperCard>
  );
}

function ProfileRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start gap-4">
      <label className="w-[190px] text-sm font-medium">{label}</label>
      <div className="flex min-w-60 flex-1 items-center gap-4">
        <div className="min-h-9 flex-1 rounded-md border px-2 py-1.5 text-sm empty:before:content-['_'] empty:before:whitespace-pre">
          {value}
        </div>
        <Button variant="outline" type="button" onClick={onEdit}>
          <PenLine size={12} />
          Edit
        </Button>
      </div>
    </div>
  );
}

function EditFields({
  editType,
  form,
  setForm,
}: {
  editType: IEditType;
  form: Partial<{
    userName: string;
    avatar: string;
    timeZone: string;
    currPasswd: string;
    newPasswd: string;
  }>;
  setForm: React.Dispatch<React.SetStateAction<Partial<{
    userName: string;
    avatar: string;
    timeZone: string;
    currPasswd: string;
    newPasswd: string;
  }>>>;
}) {
  if (editType === EditType.editName) {
    return (
      <Field label="Username" value={form.userName || ''} onChange={(userName) => setForm((prev) => ({ ...prev, userName }))} />
    );
  }
  if (editType === EditType.editAvatar) {
    return (
      <Field label="Avatar" value={form.avatar || ''} onChange={(avatar) => setForm((prev) => ({ ...prev, avatar }))} />
    );
  }
  if (editType === EditType.editTimeZone) {
    return (
      <Field label="Time Zone" value={form.timeZone || ''} onChange={(timeZone) => setForm((prev) => ({ ...prev, timeZone }))} />
    );
  }
  return (
    <>
      <Field
        label="Current Password"
        type="password"
        value={form.currPasswd || ''}
        onChange={(currPasswd) => setForm((prev) => ({ ...prev, currPasswd }))}
      />
      <Field
        label="New Password"
        type="password"
        value={form.newPasswd || ''}
        onChange={(newPasswd) => setForm((prev) => ({ ...prev, newPasswd }))}
      />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = React.useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
