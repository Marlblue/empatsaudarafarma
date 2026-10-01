"use client";

import { useActionState } from "react";
import { changePassword, updateProfile, type AccountState } from "@/app/actions/account";
import { FormField } from "@/components/form-field";

function Message({ state }: { state: AccountState }) {
  if (!state) return null;
  return <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</p>;
}

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateProfile, null);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  return (
    <form action={action} className="space-y-3">
      <FormField label="Nama lengkap" name="name" defaultValue={name} required error={err("name")} />
      <FormField label="No. HP / WhatsApp" name="phone" type="tel" defaultValue={phone} required error={err("phone")} />
      <Message state={state} />
      <button disabled={pending} className="btn-primary">Simpan Profil</button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePassword, null);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  return (
    <form action={action} className="space-y-3">
      <FormField label="Password lama" name="current" type="password" autoComplete="current-password" required error={err("current")} />
      <FormField label="Password baru" name="password" type="password" autoComplete="new-password" minLength={8} required error={err("password")} />
      <FormField label="Ulangi password baru" name="confirm" type="password" autoComplete="new-password" required error={err("confirm")} />
      <Message state={state} />
      <button disabled={pending} className="btn-primary">Ganti Password</button>
    </form>
  );
}
