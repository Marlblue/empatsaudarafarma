"use client";

import { useActionState, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/checkout";
import { formatRupiah } from "@/lib/format";
import { calculateShipping, CITIES_BY_PROVINCE, PROVINCES, type ShippingConfig } from "@/lib/shipping";
import { CityField } from "@/components/shop/city-field";

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

type Fields = {
  recipient: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  addressDetail: string;
};

function fromAddress(a: Address): Fields {
  return {
    recipient: a.recipient,
    phone: a.phone,
    province: a.province,
    city: a.city,
    district: a.district,
    postalCode: a.postalCode,
    addressDetail: a.detail,
  };
}

export function CheckoutForm({
  addresses,
  defaults,
  subtotal,
  shipping,
  codEnabled,
  items,
}: {
  addresses: Address[];
  defaults: { name: string; phone: string };
  subtotal: number;
  shipping: ShippingConfig;
  codEnabled: boolean;
  items: { id: string; name: string; quantity: number; total: number }[];
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, null);
  const initial = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [fields, setFields] = useState<Fields>(
    initial
      ? fromAddress(initial)
      : { recipient: defaults.name, phone: defaults.phone, province: "", city: "", district: "", postalCode: "", addressDetail: "" },
  );
  const [payment, setPayment] = useState<"TRANSFER" | "COD">("TRANSFER");
  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  // Di provinsi sekitar Jabodetabek, ongkir baru bisa dihitung setelah kota dipilih
  const addressReady = fields.province !== "" && (!CITIES_BY_PROVINCE[fields.province] || fields.city !== "");
  const shippingCost = addressReady ? calculateShipping(fields.province, fields.city, subtotal, shipping) : null;
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="card space-y-4 p-5">
          <h2 className="font-bold text-brand-900">Alamat Pengiriman</h2>
          {addresses.length > 0 && (
            <div>
              <label className="label" htmlFor="saved">Pilih alamat tersimpan</label>
              <select
                id="saved"
                className="input"
                defaultValue={initial?.id}
                onChange={(e) => {
                  const a = addresses.find((x) => x.id === e.target.value);
                  if (a) setFields(fromAddress(a));
                }}
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {a.recipient}, {a.city}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama penerima" error={err("recipient")}>
              <input name="recipient" value={fields.recipient} onChange={set("recipient")} required className="input" />
            </Field>
            <Field label="No. HP / WhatsApp" error={err("phone")}>
              <input name="phone" type="tel" value={fields.phone} onChange={set("phone")} required className="input" />
            </Field>
            <Field label="Provinsi" error={err("province")}>
              <select
                name="province"
                value={fields.province}
                onChange={(e) => setFields((f) => ({ ...f, province: e.target.value, city: "" }))}
                required
                className="input"
              >
                <option value="">Pilih provinsi</option>
                {PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Kota / Kabupaten" error={err("city")}>
              <CityField province={fields.province} value={fields.city} onChange={(city) => setFields((f) => ({ ...f, city }))} />
            </Field>
            <Field label="Kecamatan" error={err("district")}>
              <input name="district" value={fields.district} onChange={set("district")} required className="input" />
            </Field>
            <Field label="Kode pos" error={err("postalCode")}>
              <input name="postalCode" inputMode="numeric" maxLength={5} value={fields.postalCode} onChange={set("postalCode")} required className="input" />
            </Field>
          </div>
          <Field label="Alamat lengkap (jalan, no. rumah, RT/RW, patokan)" error={err("addressDetail")}>
            <textarea name="addressDetail" rows={3} value={fields.addressDetail} onChange={set("addressDetail")} required className="input" />
          </Field>
          <Field label="Catatan untuk penjual (opsional)" error={err("note")}>
            <textarea name="note" rows={2} className="input" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="saveAddress" defaultChecked={addresses.length === 0} className="h-4 w-4 accent-brand-600" />
            Simpan alamat ini ke akun saya
          </label>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="font-bold text-brand-900">Metode Pembayaran</h2>
          <PaymentOption
            value="TRANSFER"
            checked={payment === "TRANSFER"}
            onChange={() => setPayment("TRANSFER")}
            title="Transfer Bank"
            text="Transfer ke rekening toko, lalu unggah bukti transfer."
          />
          {codEnabled && (
            <PaymentOption
              value="COD"
              checked={payment === "COD"}
              onChange={() => setPayment("COD")}
              title="COD (Bayar di Tempat)"
              text="Bayar tunai saat pesanan diterima."
            />
          )}
          {err("paymentMethod") && <p className="text-sm text-red-600">{err("paymentMethod")}</p>}
        </section>
      </div>

      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-40">
        <h2 className="font-bold text-brand-900">Ringkasan Pesanan</h2>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4">
              <span className="text-gray-700">
                {i.name} <span className="text-gray-400">×{i.quantity}</span>
              </span>
              <span className="shrink-0 font-medium">{formatRupiah(i.total)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 border-t border-gray-100 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ongkos kirim</span>
            <span>
              {shippingCost === null ? "Pilih alamat" : shippingCost === 0 ? "Gratis" : formatRupiah(shippingCost)}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold">
            <span>Total</span>
            <span className="text-brand-700">{formatRupiah(subtotal + (shippingCost ?? 0))}</span>
          </div>
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        <button disabled={pending} className="btn-primary w-full py-3">
          {pending ? "Memproses..." : "Buat Pesanan"}
        </button>
      </aside>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function PaymentOption({
  value,
  checked,
  onChange,
  title,
  text,
}: {
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  text: string;
}) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${checked ? "border-brand-500 bg-brand-50" : "border-gray-200"}`}>
      <input type="radio" name="paymentMethod" value={value} checked={checked} onChange={onChange} className="mt-1 accent-brand-600" />
      <span>
        <span className="block font-semibold text-gray-900">{title}</span>
        <span className="text-sm text-gray-600">{text}</span>
      </span>
    </label>
  );
}
