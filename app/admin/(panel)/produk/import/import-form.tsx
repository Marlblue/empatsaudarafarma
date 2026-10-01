"use client";

import { useActionState } from "react";
import { importProducts, type ImportState } from "@/app/admin/actions/import";

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importProducts, null);
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700"
        />
        <fieldset className="space-y-2 text-sm">
          <legend className="label">Mode import</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="upsert" defaultChecked className="accent-brand-600" />
            Tambah baru & perbarui produk yang SKU-nya sudah ada
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="create" className="accent-brand-600" />
            Hanya tambah baru (lewati SKU yang sudah ada)
          </label>
        </fieldset>
        <button disabled={pending} className="btn-primary">
          {pending ? "Mengimpor... (jangan tutup halaman)" : "Mulai Import"}
        </button>
      </form>

      {state && !state.done && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}
      {state?.done && (
        <div className="space-y-3">
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            Selesai: <strong>{state.created}</strong> produk baru, <strong>{state.updated}</strong> produk diperbarui,{" "}
            <strong>{state.errors.length}</strong> catatan/error.
          </p>
          {state.errors.length > 0 && (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-red-200">
              <table className="w-full text-sm">
                <thead className="bg-red-50 text-left text-xs uppercase text-red-700">
                  <tr>
                    <th className="px-3 py-2">Baris</th>
                    <th className="px-3 py-2">Masalah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {state.errors.map((e, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 font-mono">{e.row}</td>
                      <td className="px-3 py-1.5">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
