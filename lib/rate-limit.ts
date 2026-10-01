import "server-only";

// Rate limit sederhana di memori proses. Cukup untuk satu server;
// untuk deployment multi-instance ganti dengan Redis/Upstash.
const hits = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
