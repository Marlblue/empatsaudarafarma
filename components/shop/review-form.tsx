"use client";

import { useActionState, useState } from "react";
import { submitReview, type ReviewState } from "@/app/actions/review";

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, null);
  const [rating, setRating] = useState(0);

  if (state?.ok) {
    return <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">{state.message}</p>;
  }

  return (
    <form action={action} className="card space-y-3 p-4">
      <p className="font-semibold text-gray-900">Tulis ulasan</p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} bintang`}
            onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? "text-amber-400" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea name="comment" rows={3} required className="input" placeholder="Bagaimana pengalaman Anda dengan produk ini?" />
      {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      <button disabled={pending} className="btn-primary">
        {pending ? "Mengirim..." : "Kirim Ulasan"}
      </button>
    </form>
  );
}
