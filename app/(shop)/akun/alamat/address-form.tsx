"use client";

import { useActionState } from "react";
import { saveAddress, type AccountState } from "@/app/actions/account";
import { PROVINCES } from "@/lib/shipping";

type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  detail: string;
  isDefault: boolean;
};

export function AddressForm({ address }: { address?: Address }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(
    saveAddress.bind(null, address?.id ?? null),
    null,
  );
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  const field = (name: keyof Address, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="label">{label}</span>
      <input name={name} defaultValue={address ? String(address[name]) : undefined} required className="input" {...props} />
      {err(name) && <span className="mt-1 block text-xs text-red-600">{err(name)}</span>}
    </label>
  );

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {field("label", "Label (mis. Rumah, Kantor)", { defaultValue: address?.label ?? "Rumah" })}
        {field("recipient", "Nama penerima")}
        {field("phone", "No. HP", { type: "tel" })}
        <label className="block">
          <span className="label">Provinsi</span>
          <select name="province" defaultValue={address?.province ?? ""} required className="input">
            <option value="">Pilih provinsi</option>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          {err("province") && <span className="mt-1 block text-xs text-red-600">{err("province")}</span>}
        </label>
        {field("city", "Kota / Kabupaten")}
        {field("district", "Kecamatan")}
        {field("postalCode", "Kode pos", { inputMode: "numeric", maxLength: 5 })}
      </div>
      <label className="block">
        <span className="label">Alamat lengkap</span>
        <textarea name="detail" rows={2} defaultValue={address?.detail} required className="input" />
        {err("detail") && <span className="mt-1 block text-xs text-red-600">{err("detail")}</span>}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="h-4 w-4 accent-brand-600" />
        Jadikan alamat utama
      </label>
      {state && <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</p>}
      <button disabled={pending} className="btn-primary">
        {pending ? "Menyimpan..." : "Simpan Alamat"}
      </button>
    </form>
  );
}
