import { NextResponse, type NextRequest } from "next/server";

// Pemeriksaan optimistis: tanpa cookie sesi, langsung arahkan ke login admin.
// Otorisasi sebenarnya tetap dicek di setiap halaman & action (requireStaff).
export function proxy(request: NextRequest) {
  if (!request.cookies.has("sid")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
