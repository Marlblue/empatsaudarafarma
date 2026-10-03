"use client";

import { useActionState, useState } from "react";
import { cancelOrder, type CancelState } from "@/app/actions/checkout";

export function CancelOrderForm({ code, paid }: { code: string; paid: boolean }) {
  const [state, action, pending] = useActionState<CancelState, FormData>(cancelOrder.bind(null, code), null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-outline text-red-600 hover:border-red-600">
        Batalkan Pesanan
      </button>
    );
  }
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Yakin ingin membatalkan pesanan ini?")) e.preventDefault();
      }}
      className="card w-full space-y-3 border-red-200 p-5"
    >
      <h2 className="font-bold text-gray-900">Batalkan Pesanan</h2>
      {paid && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Bukti transfer Anda sudah kami terima. Setelah pesanan dibatalkan, hubungi CS kami untuk pengembalian dana.
        </p>
      )}
      <label className="block">
        <span className="label">Alasan pembatalan (opsional)</span>
        <textarea name="reason" rows={2} maxLength={300} className="input" placeholder="mis. salah pilih produk" />
      </label>
      {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={pending} className="btn-danger">
          {pending ? "Membatalkan..." : "Ya, Batalkan Pesanan"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline">
          Tidak Jadi
        </button>
      </div>
    </form>
  );
}
