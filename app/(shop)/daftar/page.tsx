import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/format";
import { RegisterForm } from "../masuk/login-form";

export const metadata: Metadata = { title: "Daftar", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/daftar">) {
  const next = (await searchParams).next;
  const nextPath = safeNextPath(next);
  if (await getCurrentUser()) redirect(nextPath ?? "/akun");

  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 md:p-8">
        <h1 className="text-2xl font-bold text-brand-900">Daftar Akun</h1>
        <p className="mb-6 mt-1 text-sm text-gray-600">Buat akun untuk belanja lebih mudah.</p>
        <RegisterForm next={nextPath} />
        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{" "}
          <Link href={`/masuk${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`} className="font-semibold text-brand-700 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
