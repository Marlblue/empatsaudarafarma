"use client";

import { useActionState } from "react";
import { sendContactMessage, type SimpleState } from "@/app/actions/public";

const input = "h-[34px] w-full border border-[#ddd] bg-white px-2.5 text-[15px] text-[#333] outline-none focus:border-sky";
const label = "mb-1 block text-[15px] font-bold text-[#222]";

export function ContactForm() {
  const [state, action, pending] = useActionState<SimpleState, FormData>(sendContactMessage, null);
  if (state?.ok) return <p className="bg-green-50 p-4 text-green-700">{state.message}</p>;
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className={label}>Nama Anda</span>
        <input name="name" required className={input} />
      </label>
      <label className="block">
        <span className={label}>E-mail anda</span>
        <input name="email" type="email" required className={input} />
      </label>
      <label className="block">
        <span className={label}>Nomor Whatsapp</span>
        <input name="phone" type="tel" className={input} />
      </label>
      <label className="block">
        <span className={label}>Pesan Anda (opsional)</span>
        <textarea name="message" rows={5} className={`${input} h-auto py-2`} />
      </label>
      {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      <button disabled={pending} className="bg-sky px-5 py-2 text-[15px] font-bold uppercase text-white hover:brightness-95 disabled:opacity-60">
        {pending ? "Mengirim..." : "Kirim"}
      </button>
    </form>
  );
}
