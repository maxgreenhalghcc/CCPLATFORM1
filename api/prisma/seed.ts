// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed a demo bar (id/slug used by your API dev bypass & curl tests)
  await prisma.bar.upsert({
    where: { slug: 'demo-bar' },
    update: { name: 'Demo Bar', active: true },
    create: { id: 'bar_1', name: 'Demo Bar', slug: 'demo-bar', active: true },
  });

  // OPTIONAL: seed an admin user tied to the demo bar (adjust fields to your schema)
  // If your User model differs, comment this block out.
  try {
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: { role: 'admin' as any }, // cast if your enum name differs
      create: {
        id: 'user_admin_1',
        email: 'admin@example.com',
        role: 'admin' as any, // keep minimal & compatible
        barId: 'bar_1',
      },
    });
  } catch {
    // Ignore if the model/fields don't exist in your current schema
  }

  console.log('Seed completed: demo-bar (and optional admin user) created.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
