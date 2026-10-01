"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Menyimpan...",
  className = "btn-primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} {...props}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Tombol submit dengan konfirmasi browser, untuk aksi berbahaya (hapus, batalkan). */
export function ConfirmButton({
  message,
  children,
  className = "text-sm font-semibold text-red-600 hover:underline",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      {...props}
    >
      {children}
    </button>
  );
}

/** Tombol "Terapkan" aksi massal; minta konfirmasi bila aksi yang dipilih adalah hapus. */
export function BulkSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-outline py-1.5"
      onClick={(e) => {
        const form = e.currentTarget.form;
        const action = form?.querySelector<HTMLSelectElement>("select[name=bulkAction]")?.value;
        if (action === "delete" && !confirm("Hapus semua produk terpilih? Tindakan ini tidak bisa dibatalkan.")) {
          e.preventDefault();
        }
      }}
    >
      {pending ? "Memproses..." : "Terapkan"}
    </button>
  );
}
