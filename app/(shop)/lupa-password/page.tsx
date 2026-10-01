import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/format";

export const metadata: Metadata = { title: "Lupa Password", robots: { index: false } };

// Reset otomatis via email membutuhkan layanan email (Resend/SMTP) yang belum dikonfigurasi.
// Sementara, admin dapat mereset password pelanggan dari panel admin.
export default async function ForgotPasswordPage() {
  const settings = await getSettings();
  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md space-y-4 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-brand-900">Lupa Password</h1>
        <p className="text-sm text-gray-600">
          Hubungi customer service kami melalui WhatsApp dengan menyebutkan email akun Anda. Kami akan membantu mengatur ulang
          password Anda.
        </p>
        <a
          href={waLink(settings.whatsapp, "Halo, saya lupa password akun saya. Email akun saya: ")}
          target="_blank"
          rel="noopener"
          className="btn-wa w-full"
        >
          Hubungi via WhatsApp
        </a>
      </div>
    </div>
  );
}
