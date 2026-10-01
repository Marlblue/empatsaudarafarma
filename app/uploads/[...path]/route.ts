import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { MIME_BY_EXT, UPLOAD_ROOT } from "@/lib/storage";

export async function GET(_req: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: segments } = await ctx.params;
  const target = path.resolve(/*turbopackIgnore: true*/ UPLOAD_ROOT, ...segments);
  if (!target.startsWith(UPLOAD_ROOT + path.sep)) {
    return new Response("Not found", { status: 404 });
  }
  // Bukti transfer hanya boleh dilihat admin/staf
  const isPrivate = segments[0] === "proofs";
  if (isPrivate) {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) return new Response("Forbidden", { status: 403 });
  }
  const ext = path.extname(target).slice(1).toLowerCase();
  try {
    const data = await readFile(target);
    return new Response(data, {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": isPrivate ? "private, no-store" : "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
