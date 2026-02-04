// Seed a single sample PAID order for demo-bar.
// Usage (staging):
//   cd api && node scripts/seed-sample-order.js
// Requires DATABASE_URL in env.

const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const bar = await prisma.bar.findUnique({ where: { slug: 'demo-bar' } });
  if (!bar) throw new Error('demo-bar not found');

  const session = await prisma.quizSession.create({
    data: {
      barId: bar.id,
      status: 'submitted',
      answerRecord: {
        seeded: true,
        vibe: 'bold',
        spirit: 'gin',
        sweetness: 'medium',
        citrus: 'lime'
      }
    }
  });

  const recipe = await prisma.recipe.create({
    data: {
      barId: bar.id,
      sessionId: session.id,
      name: 'Seeded Demo Cocktail',
      description: 'A clean, bright gin sour-style drink (seeded sample order).',
      body: {
        ingredients: [
          { name: 'Gin', amount: '50ml' },
          { name: 'Fresh lime', amount: '25ml' },
          { name: 'Simple syrup', amount: '15ml' },
          { name: 'Aquafaba', amount: '15ml' }
        ],
        method: 'Shake hard with ice, double strain into a chilled coupe.',
        garnish: 'Lime wheel',
        glassware: 'Coupe'
      },
      result: {
        name: 'Seeded Demo Cocktail',
        method: 'Shake hard with ice, double strain into a chilled coupe.',
        glassware: 'Coupe',
        garnish: 'Lime wheel',
        warnings: []
      }
    }
  });

  const amount = new Prisma.Decimal(12);

  const order = await prisma.order.create({
    data: {
      barId: bar.id,
      sessionId: session.id,
      recipeId: recipe.id,
      amount,
      currency: 'gbp',
      status: 'paid',
      contact: 'Seeded Customer',
      recipeJson: {
        name: recipe.name,
        description: recipe.description,
        ingredients: recipe.body.ingredients,
        method: recipe.body.method,
        glassware: recipe.body.glassware,
        garnish: recipe.body.garnish,
        warnings: []
      },
      items: {
        create: [{ sku: 'custom-cocktail', qty: 1 }]
      },
      payments: {
        create: {
          provider: 'stripe',
          intentId: `pi_seed_${Date.now()}`,
          amount,
          status: 'succeeded',
          raw: { seeded: true }
        }
      }
    }
  });

  console.log(JSON.stringify({ ok: true, orderId: order.id, barSlug: bar.slug }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
