// api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Example row — adjust to your schema
  await prisma.bar.upsert({
    where: { slug: 'demo-bar' },
    update: {},
    create: { id: 'bar_1', name: 'Demo Bar', slug: 'demo-bar', active: true },
  });
}

main().catch(e => { console.error(e); process.exit(1); })
      .finally(async () => { await prisma.$disconnect(); });
