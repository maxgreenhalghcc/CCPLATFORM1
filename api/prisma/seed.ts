/* api/prisma/seed.ts */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1) A demo bar
  const bar = await prisma.bar.upsert({
    where: { slug: 'demo-bar' },
    update: {},
    create: {
      id: 'demo-bar', // if your schema uses a string id, use slug as id; else remove this field
      name: 'Demo Bar',
      slug: 'demo-bar',
      // add any required fields your schema enforces
    },
  });

  // 2) A staff/admin user tied to the bar
  const user = await prisma.user.upsert({
    where: { email: 'dev@demo.local' },
    update: {},
    create: {
      email: 'dev@demo.local',
      role: 'admin', // or 'staff' depending on your enum
      barId: bar.id,
      // add any required fields (name, password hash if applicable)
    },
  });

  // 3) A few orders for that bar
  await prisma.order.createMany({
    data: [
      {
        barId: bar.id,
        status: 'open', // or whatever your enum uses
        total: 2450,    // cents if you store money as integers
      },
      {
        barId: bar.id,
        status: 'completed',
        total: 5600,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete:', { bar: bar.slug, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
