import { Prisma, PrismaClient } from '@prisma/client';

const shouldSeed = (process.env.SEED_ON_BOOT ?? 'true').toLowerCase() !== 'false';

if (!shouldSeed) {
  console.info('Seed skipped because SEED_ON_BOOT=false');
  process.exit(0);
}

const prisma = new PrismaClient();

/**
 * Populates the database with initial demo data for development and testing.
 *
 * Upserts a demo bar and a sample bar with their settings, ensures a set of common ingredients exist,
 * creates a verification timestamp, and upserts an admin user and a staff user (the staff user is
 * associated with the demo bar). Logs the created demo bar id on completion.
 */
async function main() {
  const introCopy =
    'Welcome to Demo Bar. Answer a few questions and we will craft a cocktail just for you.';
  const outroCopy =
    'Thanks for trying the Demo Bar experience! Visit the bar to enjoy your custom cocktail.';

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
            introText: introCopy,
            outroText: outroCopy,
            pricingPounds: new Prisma.Decimal(12),
          },
          create: {
            theme: {
              primary: '#7c3aed',
              background: '#0b0b12',
              foreground: '#ffffff',
            },
            introText: introCopy,
            outroText: outroCopy,
            pricingPounds: new Prisma.Decimal(12),
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
          introText: introCopy,
          outroText: outroCopy,
          pricingPounds: new Prisma.Decimal(12),
        },
      },
    },
  });

  await prisma.bar.upsert({
    where: { slug: 'sample-bar-2' },
    update: {
      name: 'Sample Bar 2',
      active: true,
      location: 'Manchester',
      settings: {
        upsert: {
          update: {
            theme: {
              primary: '#ff6b6b',
              background: '#1a0f0f',
              foreground: '#ffffff',
              card: '#241414',
            },
            introText: 'Discover bold flavours crafted in Manchester.',
            outroText: 'Visit again soon for another tailored cocktail.',
            pricingPounds: new Prisma.Decimal(11.5),
          },
          create: {
            theme: {
              primary: '#ff6b6b',
              background: '#1a0f0f',
              foreground: '#ffffff',
              card: '#241414',
            },
            introText: 'Discover bold flavours crafted in Manchester.',
            outroText: 'Visit again soon for another tailored cocktail.',
            pricingPounds: new Prisma.Decimal(11.5),
          },
        },
      },
    },
    create: {
      name: 'Sample Bar 2',
      slug: 'sample-bar-2',
      active: true,
      location: 'Manchester',
      settings: {
        create: {
          theme: {
            primary: '#ff6b6b',
            background: '#1a0f0f',
            foreground: '#ffffff',
            card: '#241414',
          },
          introText: 'Discover bold flavours crafted in Manchester.',
          outroText: 'Visit again soon for another tailored cocktail.',
          pricingPounds: new Prisma.Decimal(11.5),
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
      })
    )
  );

  const verificationDate = new Date();

  await prisma.user.upsert({
    where: { email: 'admin@platform.bar' },
    update: {
      role: 'admin',
      barId: null,
      emailVerified: verificationDate,
      name: 'Platform Admin',
    },
    create: {
      email: 'admin@platform.bar',
      role: 'admin',
      barId: null,
      emailVerified: verificationDate,
      name: 'Platform Admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@demo.bar' },
    update: {
      role: 'staff',
      barId: demoBar.id,
      emailVerified: verificationDate,
      name: 'Demo Bartender',
    },
    create: {
      email: 'staff@demo.bar',
      role: 'staff',
      barId: demoBar.id,
      emailVerified: verificationDate,
      name: 'Demo Bartender',
    },
  });

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