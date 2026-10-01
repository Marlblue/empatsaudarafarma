"use client";

import { useActionState } from "react";
import { adminLogin, type FormState } from "@/app/actions/auth";
import { FormField } from "@/components/form-field";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(adminLogin, null);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  return (
    <form action={action} className="space-y-4">
      <FormField label="Email" name="email" type="email" autoComplete="username" required error={err("email")} />
      <FormField label="Password" name="password" type="password" autoComplete="current-password" required error={err("password")} />
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
