import { redirect } from "next/navigation";

// Formulir kontak & peta ada di halaman About Us (seperti amanfarma.com)
export default function ContactPage() {
  redirect("/tentang#kontak");
}
