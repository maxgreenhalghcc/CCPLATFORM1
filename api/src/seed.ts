import { Prisma, PrismaClient } from '@prisma/client';

const shouldSeed = (process.env.SEED_ON_BOOT ?? 'true').toLowerCase() !== 'false';

if (!shouldSeed) {
  console.info('Seed skipped because SEED_ON_BOOT=false');
  process.exit(0);
}

const prisma = new PrismaClient();

async function main() {
  const introCopy =
    'Welcome to Demo Bar. Answer a few questions and we will craft a cocktail just for you.';
  const outroCopy =
    'Thanks for trying the Demo Bar experience! Visit the bar to enjoy your custom cocktail.';
  const demoPalette = {
    dominant: '#050315',
    secondary: '#2f27ce',
    accent: '#dedcff'
  };

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
            contactName: 'Sam Carter',
            contactEmail: 'owner@demo.bar',
            contactPhone: '+44 20 1234 5678',
            address: {
              line1: '12 Demo Street',
              city: 'London',
              postcode: 'E1 6AN',
              country: 'United Kingdom'
            },
            openingHours: {
              Monday: '12:00-22:00',
              Tuesday: '12:00-22:00',
              Wednesday: '12:00-22:00',
              Thursday: '12:00-23:00',
              Friday: '12:00-00:00',
              Saturday: '12:00-00:00',
              Sunday: '12:00-21:00'
            },
            stock: ['Vodka', 'Gin', 'Lime'],
            stockListUrl: 'https://example.com/demo-bar-stock.pdf',
            bankDetails: {
              accountName: 'Demo Bar Ltd',
              accountNumber: '12345678',
              sortCode: '04-00-04'
            },
            stripeConnectId: 'acct_demo123',
            stripeConnectLink: 'https://dashboard.stripe.com/connect/accounts',
            brandPalette: demoPalette,
            logoUrl: 'https://example.com/demo-bar-logo.svg'
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
            contactName: 'Sam Carter',
            contactEmail: 'owner@demo.bar',
            contactPhone: '+44 20 1234 5678',
            address: {
              line1: '12 Demo Street',
              city: 'London',
              postcode: 'E1 6AN',
              country: 'United Kingdom'
            },
            openingHours: {
              Monday: '12:00-22:00',
              Tuesday: '12:00-22:00',
              Wednesday: '12:00-22:00',
              Thursday: '12:00-23:00',
              Friday: '12:00-00:00',
              Saturday: '12:00-00:00',
              Sunday: '12:00-21:00'
            },
            stock: ['Vodka', 'Gin', 'Lime'],
            stockListUrl: 'https://example.com/demo-bar-stock.pdf',
            bankDetails: {
              accountName: 'Demo Bar Ltd',
              accountNumber: '12345678',
              sortCode: '04-00-04'
            },
            stripeConnectId: 'acct_demo123',
            stripeConnectLink: 'https://dashboard.stripe.com/connect/accounts',
            brandPalette: demoPalette,
            logoUrl: 'https://example.com/demo-bar-logo.svg'
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
          contactName: 'Sam Carter',
          contactEmail: 'owner@demo.bar',
          contactPhone: '+44 20 1234 5678',
          address: {
            line1: '12 Demo Street',
            city: 'London',
            postcode: 'E1 6AN',
            country: 'United Kingdom'
          },
          openingHours: {
            Monday: '12:00-22:00',
            Tuesday: '12:00-22:00',
            Wednesday: '12:00-22:00',
            Thursday: '12:00-23:00',
            Friday: '12:00-00:00',
            Saturday: '12:00-00:00',
            Sunday: '12:00-21:00'
          },
          stock: ['Vodka', 'Gin', 'Lime'],
          stockListUrl: 'https://example.com/demo-bar-stock.pdf',
          bankDetails: {
            accountName: 'Demo Bar Ltd',
            accountNumber: '12345678',
            sortCode: '04-00-04'
          },
          stripeConnectId: 'acct_demo123',
          stripeConnectLink: 'https://dashboard.stripe.com/connect/accounts',
          brandPalette: demoPalette,
          logoUrl: 'https://example.com/demo-bar-logo.svg'
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
            contactName: 'Priya Mehta',
            contactEmail: 'owner@samplebar2.bar',
            contactPhone: '+44 161 555 0101',
            address: {
              line1: '22 Northern Quarter',
              city: 'Manchester',
              postcode: 'M1 1AE',
              country: 'United Kingdom'
            },
            openingHours: {
              Monday: '14:00-22:00',
              Tuesday: '14:00-22:00',
              Wednesday: '14:00-23:00',
              Thursday: '14:00-23:00',
              Friday: '14:00-01:00',
              Saturday: '12:00-01:00',
              Sunday: '12:00-20:00'
            },
            stock: ['Rum', 'Tequila', 'Angostura Bitters'],
            stockListUrl: 'https://example.com/sample-bar-2-stock.pdf',
            bankDetails: {
              accountName: 'Sample Bar 2 Ltd',
              accountNumber: '87654321',
              sortCode: '10-00-20'
            },
            stripeConnectId: 'acct_samplebar2',
            stripeConnectLink: 'https://dashboard.stripe.com/connect/accounts',
            brandPalette: {
              dominant: '#1a0f0f',
              secondary: '#ff6b6b',
              accent: '#ffd1d1'
            },
            logoUrl: 'https://example.com/sample-bar-2-logo.svg'
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
            contactName: 'Priya Mehta',
            contactEmail: 'owner@samplebar2.bar',
            contactPhone: '+44 161 555 0101',
            address: {
              line1: '22 Northern Quarter',
              city: 'Manchester',
              postcode: 'M1 1AE',
              country: 'United Kingdom'
            },
            openingHours: {
              Monday: '14:00-22:00',
              Tuesday: '14:00-22:00',
              Wednesday: '14:00-23:00',
              Thursday: '14:00-23:00',
              Friday: '14:00-01:00',
              Saturday: '12:00-01:00',
              Sunday: '12:00-20:00'
            },
            stock: ['Rum', 'Tequila', 'Angostura Bitters'],
            stockListUrl: 'https://example.com/sample-bar-2-stock.pdf',
            bankDetails: {
              accountName: 'Sample Bar 2 Ltd',
              accountNumber: '87654321',
              sortCode: '10-00-20'
            },
            stripeConnectId: 'acct_samplebar2',
            stripeConnectLink: 'https://dashboard.stripe.com/connect/accounts',
            brandPalette: {
              dominant: '#1a0f0f',
              secondary: '#ff6b6b',
              accent: '#ffd1d1'
            },
            logoUrl: 'https://example.com/sample-bar-2-logo.svg'
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
