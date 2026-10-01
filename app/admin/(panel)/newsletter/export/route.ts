import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return new Response("Unauthorized", { status: 401 });
  const subscribers = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "asc" } });
  const csv = toCsv(
    ["email", "tanggal_daftar"],
    subscribers.map((s) => [s.email, s.createdAt.toISOString()]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
