import Link from "next/link";

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link href={back.href} className="mb-1 inline-block text-sm text-gray-500 hover:text-brand-700">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Flash({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const ok = typeof searchParams.ok === "string" ? searchParams.ok : null;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  if (!ok && !error) return null;
  const messages: Record<string, string> = { forbidden: "Anda tidak memiliki akses ke halaman tersebut." };
  return (
    <p
      role="status"
      className={`mb-4 rounded-lg px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
    >
      {error ? (messages[error] ?? error) : ok}
    </p>
  );
}

export function Pagination({
  page,
  totalPages,
  href,
}: {
  page: number;
  totalPages: number;
  href: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Halaman">
      <span className="text-gray-500">
        Halaman {page} dari {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="btn-outline py-1.5">
            ‹ Sebelumnya
          </Link>
        )}
        {page < totalPages && (
          <Link href={href(page + 1)} className="btn-outline py-1.5">
            Berikutnya ›
          </Link>
        )}
      </div>
    </nav>
  );
}

export function buildQuery(base: string, params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}
