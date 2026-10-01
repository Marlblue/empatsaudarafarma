"use client";

import { useActionState } from "react";
import { confirmPayment, type ConfirmState } from "@/app/actions/checkout";

export function ConfirmPaymentForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(confirmPayment.bind(null, code), null);

  if (state?.ok) {
    return <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">{state.message}</p>;
  }
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Nama pemilik rekening</span>
          <input name="senderName" required className="input" />
        </label>
        <label className="block">
          <span className="label">Bank asal</span>
          <input name="senderBank" required placeholder="mis. BCA, Mandiri" className="input" />
        </label>
      </div>
      <label className="block">
        <span className="label">Bukti transfer (JPG, PNG, atau PDF, maks. 5 MB)</span>
        <input
          name="proof"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700"
        />
      </label>
      {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      <button disabled={pending} className="btn-primary">
        {pending ? "Mengunggah..." : "Kirim Konfirmasi Pembayaran"}
      </button>
    </form>
  );
}
