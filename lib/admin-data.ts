import "server-only";
import { db } from "@/lib/db";

/** Kategori terurut sebagai daftar datar dengan kedalaman, untuk pilihan di form admin */
export async function categoryOptions() {
  const all = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, parentId: true },
  });
  const out: { id: string; name: string; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const c of all.filter((x) => x.parentId === parentId)) {
      out.push({ id: c.id, name: c.name, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}
