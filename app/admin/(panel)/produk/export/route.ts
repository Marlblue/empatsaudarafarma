import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { PRODUCT_CSV_COLUMNS } from "@/lib/product-csv";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return new Response("Unauthorized", { status: 401 });

  const origin = new URL(request.url).origin;
  const isTemplate = new URL(request.url).searchParams.has("template");
  const header = [...PRODUCT_CSV_COLUMNS];

  let rows: unknown[][];
  if (isTemplate) {
    rows = [
      [
        "AF-0001", "Aminophylline Injeksi", "", 215000, "", 20, 1, 700, "Injeksi Perbox",
        "AMINOPHYLLINE", "AMINOPHYLLINE", "", "PHAPROS Tbk – Indonesia", "INJEKSI; 24 MG", "DUS, 30 AMPUL @ 10 ML", "PHAPROS Tbk – Indonesia", "",
        "Aminophylline injeksi isi 30 ampul", "Deskripsi lengkap produk", 1, 0, 0, "PUBLISHED", "",
      ],
    ];
  } else {
    const products = await db.product.findMany({
      orderBy: { name: "asc" },
      include: {
        categories: { include: { category: { select: { name: true } } } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    rows = products.map((p) => [
      p.sku, p.name, p.slug, p.price, p.compareAtPrice, p.stock, p.trackStock ? 1 : 0, p.weightGram,
      p.categories.map((c) => c.category.name).join("|"),
      p.genericName, p.activeIngredient, p.brand, p.registrant, p.dosageForm, p.packaging, p.manufacturer, p.bpomNumber,
      p.shortDescription, p.description,
      p.requiresPrescription ? 1 : 0, p.isFeatured ? 1 : 0, p.isBestSeller ? 1 : 0, p.status,
      p.images.map((i) => (i.url.startsWith("/") ? origin + i.url : i.url)).join("|"),
    ]);
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${isTemplate ? "template-produk" : `produk-${date}`}.csv"`,
    },
  });
}
