"use client";

import { useActionState, useRef } from "react";
import { subscribeNewsletter, type SimpleState } from "@/app/actions/public";
import { EnvelopeIcon } from "@/components/icons";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<SimpleState, FormData>(subscribeNewsletter, null);
  if (state?.ok) return <p className="text-sm text-green-700">{state.message}</p>;
  return (
    <form action={action} className="space-y-2">
      <div className="flex">
        <input type="email" name="email" required placeholder="Alamat email Anda" aria-label="Email newsletter" className="input" />
        <button disabled={pending} className="btn-primary shrink-0">
          Daftar
        </button>
      </div>
      {state && !state.ok && <p className="text-xs text-red-600">{state.message}</p>}
    </form>
  );
}

/** Tautan "Newsletter" di top bar yang membuka popup pendaftaran */
export function NewsletterPopup({ className }: { className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={className}>
        <EnvelopeIcon /> Newsletter
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[min(92vw,460px)] p-0 backdrop:bg-black/60"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        <div className="relative p-8 text-center">
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => ref.current?.close()}
            className="absolute right-3 top-2 text-2xl text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
          <h2 className="text-xl font-bold uppercase tracking-wide text-heading">Newsletter</h2>
          <div className="divider mx-auto" />
          <p className="mb-5 text-sm">Daftar untuk mendapatkan info promo dan produk terbaru.</p>
          <NewsletterForm />
        </div>
      </dialog>
    </>
  );
}
