"use client";

import { useActionState } from "react";
import { login, register, type FormState } from "@/app/actions/auth";
import { FormField } from "@/components/form-field";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, null);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <FormField label="Email" name="email" type="email" autoComplete="email" required error={err("email")} />
      <FormField label="Password" name="password" type="password" autoComplete="current-password" required error={err("password")} />
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(register, null);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <FormField label="Nama lengkap" name="name" autoComplete="name" required error={err("name")} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required error={err("email")} />
      <FormField label="No. HP / WhatsApp" name="phone" type="tel" autoComplete="tel" required error={err("phone")} />
      <FormField label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} hint="Minimal 8 karakter" error={err("password")} />
      <FormField label="Ulangi password" name="confirm" type="password" autoComplete="new-password" required error={err("confirm")} />
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? "Memproses..." : "Daftar"}
      </button>
    </form>
  );
}
