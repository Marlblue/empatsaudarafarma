/**
 * Ekspor database lokal ke satu file SQL untuk di-import di server (phpPgAdmin / psql):
 * struktur tabel (dari prisma/migrations), riwayat migrasi Prisma, lalu seluruh data.
 * Sesi login tidak ikut diekspor.
 *
 *   pnpm db:export   → deploy/database.sql
 *   DB_APP_USER=empatsau_app pnpm db:export   (tambahkan GRANT untuk user aplikasi di server)
 */
import "dotenv/config";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const OUT = path.resolve("deploy", "database.sql");
const MIGRATIONS = path.resolve("prisma", "migrations");
const SKIP_DATA = new Set(["Session", "_prisma_migrations"]);
const CHUNK = 200;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const lit = (s) => `'${s.replace(/'/g, "''")}'`;
const ident = (s) => `"${s.replace(/"/g, '""')}"`;
const out = ["-- Empat Saudara Farma: struktur + data", "BEGIN;", ""];

// 1. Struktur: migrasi Prisma berurutan
const migrationDirs = readdirSync(MIGRATIONS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();
for (const dir of migrationDirs) {
  out.push(`-- migrasi ${dir}`, readFileSync(path.join(MIGRATIONS, dir, "migration.sql"), "utf8"), "");
}

// 2. Riwayat migrasi agar `prisma migrate deploy` di kemudian hari tahu migrasi mana yang sudah jalan
out.push(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) PRIMARY KEY NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);`);
const { rows: applied } = await client.query(
  `SELECT row_to_json(m)::text AS j FROM "_prisma_migrations" m WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY started_at`,
);
for (const { j } of applied) {
  out.push(`INSERT INTO "_prisma_migrations" SELECT * FROM json_populate_record(NULL::"_prisma_migrations", ${lit(j)});`);
}
out.push("");

// 3. Data: tabel diurutkan mengikuti foreign key (induk lebih dulu)
const { rows: tables } = await client.query(
  `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
);
const { rows: fks } = await client.query(`
  SELECT tc.table_name AS child, ccu.table_name AS parent
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`);
const names = tables.map((t) => t.table_name).filter((n) => !SKIP_DATA.has(n));
const parents = new Map(names.map((n) => [n, new Set(fks.filter((f) => f.child === n && f.parent !== n).map((f) => f.parent))]));
const ordered = [];
const visit = (n, seen = new Set()) => {
  if (ordered.includes(n) || seen.has(n)) return;
  seen.add(n);
  for (const p of parents.get(n) ?? []) if (parents.has(p)) visit(p, seen);
  ordered.push(n);
};
names.sort().forEach((n) => visit(n));

let total = 0;
for (const table of ordered) {
  // Baris tanpa induk (mis. kategori utama) lebih dulu untuk relasi ke tabel sendiri
  const selfRef = fks.find((f) => f.child === table && f.parent === table);
  const { rows: cols } = selfRef
    ? await client.query(
        `SELECT kcu.column_name FROM information_schema.key_column_usage kcu
         JOIN information_schema.table_constraints tc ON tc.constraint_name = kcu.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.table_name = $1`,
        [table],
      )
    : { rows: [] };
  const selfCol = cols.map((c) => c.column_name).find(Boolean);
  const order = selfCol ? `ORDER BY (t.${ident(selfCol)} IS NOT NULL)` : "";
  const { rows } = await client.query(`SELECT row_to_json(t)::text AS j FROM ${ident(table)} t ${order}`);
  if (!rows.length) continue;
  out.push(`-- ${table}: ${rows.length} baris`);
  for (let i = 0; i < rows.length; i += CHUNK) {
    const json = `[${rows
      .slice(i, i + CHUNK)
      .map((r) => r.j)
      .join(",")}]`;
    out.push(`INSERT INTO ${ident(table)} SELECT * FROM json_populate_recordset(NULL::${ident(table)}, ${lit(json)});`);
  }
  out.push("");
  total += rows.length;
}

// Bila import dijalankan sebagai user lain (mis. user cPanel di phpPgAdmin), beri akses ke user aplikasi
const appUser = process.env.DB_APP_USER;
if (appUser) {
  out.push(
    `-- akses untuk user aplikasi`,
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${ident(appUser)};`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${ident(appUser)};`,
    "",
  );
}

out.push("COMMIT;", "");
await client.end();

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, out.join("\n"));
console.log(`Selesai: ${ordered.length} tabel, ${total} baris → ${OUT}`);
