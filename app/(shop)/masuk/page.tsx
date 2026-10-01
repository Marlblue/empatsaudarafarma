import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/format";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/masuk">) {
  const next = (await searchParams).next;
  const nextPath = safeNextPath(next);
  if (await getCurrentUser()) redirect(nextPath ?? "/akun");

  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 md:p-8">
        <h1 className="text-2xl font-bold text-brand-900">Masuk</h1>
        <p className="mb-6 mt-1 text-sm text-gray-600">Masuk untuk checkout dan melihat riwayat pesanan.</p>
        <LoginForm next={nextPath} />
        <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
          <p>
            Belum punya akun?{" "}
            <Link href={`/daftar${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`} className="font-semibold text-brand-700 hover:underline">
              Daftar sekarang
            </Link>
          </p>
          <p>
            <Link href="/lupa-password" className="text-brand-700 hover:underline">Lupa password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
