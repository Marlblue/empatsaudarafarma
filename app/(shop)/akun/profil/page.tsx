import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PasswordForm, ProfileForm } from "./profile-forms";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser("/akun/profil");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Profil & Password</h1>
      <section className="card max-w-xl p-5">
        <h2 className="mb-4 font-bold text-brand-900">Data Diri</h2>
        <p className="mb-3 text-sm text-gray-500">Email: {user.email}</p>
        <ProfileForm name={user.name} phone={user.phone ?? ""} />
      </section>
      <section className="card max-w-xl p-5">
        <h2 className="mb-4 font-bold text-brand-900">Ganti Password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
