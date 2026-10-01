import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Login Admin" };

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user && isStaff(user.role)) redirect("/admin");
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6 shadow-sm">
        <p className="text-sm font-semibold text-brand-600">{settings.storeName}</p>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Login Admin</h1>
        <AdminLoginForm />
      </div>
    </div>
  );
}
