"use client";

/** Checkbox "pilih semua" untuk checkbox dengan atribut form yang sama */
export function SelectAll({ form }: { form: string }) {
  return (
    <input
      type="checkbox"
      aria-label="Pilih semua"
      className="h-4 w-4 accent-brand-600"
      onChange={(e) => {
        document
          .querySelectorAll<HTMLInputElement>(`input[type=checkbox][form="${form}"][name="ids"]`)
          .forEach((cb) => (cb.checked = e.target.checked));
      }}
    />
  );
}
