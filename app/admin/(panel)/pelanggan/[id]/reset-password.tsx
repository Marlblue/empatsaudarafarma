"use client";

import { useActionState } from "react";
import { resetCustomerPassword } from "@/app/admin/actions/misc";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(resetCustomerPassword.bind(null, userId), null);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Buat password sementara untuk pelanggan ini? Password lama tidak berlaku lagi.")) e.preventDefault();
      }}
      className="space-y-2"
    >
      <button disabled={pending} className="btn-outline w-full">
        {pending ? "Memproses..." : "Reset Password"}
      </button>
      {state && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Password sementara: <strong className="font-mono">{state.password}</strong>
          <br />
          Kirimkan ke pelanggan dan minta segera diganti. Password ini hanya ditampilkan sekali.
        </p>
      )}
    </form>
  );
}
