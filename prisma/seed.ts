import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // Admin awal
  const adminEmail = "admin@farma.local";
  await db.user.upsert({
    where: { email: adminEmail },
    create: {
      name: "Administrator",
      email: adminEmail,
      passwordHash: await bcrypt.hash("admin12345", 10),
      role: "ADMIN",
    },
    update: {},
  });

  await db.shippingRate.upsert({
    where: { region: "DKI Jakarta" },
    create: { region: "DKI Jakarta", cost: 10000 },
    update: {},
  });

  console.log(`Seed selesai. Login admin: ${adminEmail} / admin12345`);
  console.log("Isi katalog dengan: pnpm import:amanfarma");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
