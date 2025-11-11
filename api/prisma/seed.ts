// prisma/seed.ts
import { PrismaClient, $Enums } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ensure a demo bar exists
  await prisma.bar.upsert({
    where: { slug: 'demo-bar' },
    update: {},
    create: { id: 'bar_1', name: 'Demo Bar', slug: 'demo-bar', active: true },
  });

  // Optional: seed a couple of orders tied to demo-bar
  // Adjust fields to match your actual schema
  await prisma.order.createMany({
    data: [
      {
        id: 'order_1',
        barId: 'bar_1',
        // 👇 IMPORTANT: use enums, not strings
        status: $Enums.OrderStatus.open,
        total: 0,
      },
      {
        id: 'order_2',
        barId: 'bar_1',
        status: $Enums.OrderStatus.completed,
        total: 0,
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
