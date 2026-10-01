import { db } from "@/lib/db";
import { searchWhere } from "@/lib/catalog";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json([]);
  const products = await db.product.findMany({
    where: { status: "PUBLISHED", ...searchWhere(q.slice(0, 100)) },
    orderBy: { soldCount: "desc" },
    take: 6,
    select: {
      name: true,
      slug: true,
      price: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  });
  return Response.json(
    products.map((p) => ({ name: p.name, slug: p.slug, price: p.price, image: p.images[0]?.url ?? null })),
  );
}
