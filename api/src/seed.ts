import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const demoBar = await prisma.bar.upsert({
    where: { slug: 'demo-bar' },
    update: {
      name: 'Demo Bar',
      active: true,
      settings: {
        upsert: {
          update: {
            theme: {
              primary: '#7c3aed',
              background: '#0b0b12',
              foreground: '#ffffff',
            },
            introText: 'Welcome to Demo Bar. Answer a few questions and we will craft a cocktail just for you.',
            outroText: 'Thanks for trying the Demo Bar experience! Visit the bar to enjoy your custom cocktail.',
            pricingCents: 1200,
          },
          create: {
            theme: {
              primary: '#7c3aed',
              background: '#0b0b12',
              foreground: '#ffffff',
            },
            introText: 'Welcome to Demo Bar. Answer a few questions and we will craft a cocktail just for you.',
            outroText: 'Thanks for trying the Demo Bar experience! Visit the bar to enjoy your custom cocktail.',
            pricingCents: 1200,
          },
        },
      },
    },
    create: {
      name: 'Demo Bar',
      slug: 'demo-bar',
      active: true,
      settings: {
        create: {
          theme: {
            primary: '#7c3aed',
            background: '#0b0b12',
            foreground: '#ffffff',
          },
          introText: 'Welcome to Demo Bar. Answer a few questions and we will craft a cocktail just for you.',
          outroText: 'Thanks for trying the Demo Bar experience! Visit the bar to enjoy your custom cocktail.',
          pricingCents: 1200,
        },
      },
    },
  });

  const ingredients = [
    'Vodka',
    'Gin',
    'Rum',
    'Tequila',
    'Lime',
    'Lemon',
    'Sugar Syrup',
    'Angostura Bitters',
    'Soda',
  ];

  await Promise.all(
    ingredients.map((name) =>
      prisma.ingredient.upsert({
        where: { name },
        update: {
          active: true,
          allergenFlags: [],
        },
        create: {
          name,
          active: true,
          allergenFlags: [],
        },
      }),
    ),
  );

  console.info('Seed data created. Demo bar id:', demoBar.id);
}

main()
  .catch((error) => {
    console.error('Failed to seed database', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
